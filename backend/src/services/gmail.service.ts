import { Email } from "../models/email.model";
import { EmailAttachment, isExcelMime, isExcelFilename } from "../models/emailAttachment.model";

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType: string;
  filename?: string;
  body: { data?: string; attachmentId?: string; size?: number };
  parts?: GmailPart[];
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  payload: {
    headers: GmailHeader[];
    body: { data?: string };
    parts?: GmailPart[];
  };
  snippet: string;
  internalDate: string;
  labelIds: string[];
}

const decodeBase64 = (data?: string): string => {
  if (!data) return "";

  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

const extractBody = (payload: GmailMessageDetail["payload"]): string => {

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {

    const findBody = (parts: GmailPart[]): string => {

      for (const part of parts) {

        if (part.mimeType === "text/plain" && part.body?.data) {
          return decodeBase64(part.body.data);
        }

        if (part.parts) {
          const nested = findBody(part.parts);
          if (nested) return nested;
        }

      }

      for (const part of parts) {

        if (part.mimeType === "text/html" && part.body?.data) {

          const html = decodeBase64(part.body.data);

          return html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        }

      }

      return "";

    };

    return findBody(payload.parts);

  }

  return "";
};

function collectExcelAttachments(
  parts: GmailPart[] | undefined,
  acc: { attachmentId: string; filename: string; mimeType: string; size?: number }[] = []
): { attachmentId: string; filename: string; mimeType: string; size?: number }[] {
  if (!parts) return acc;
  for (const part of parts) {
    const aid = part.body?.attachmentId;
    const fn = part.filename || "";
    const mt = part.mimeType || "";
    if (aid && (isExcelMime(mt) || isExcelFilename(fn))) {
      acc.push({
        attachmentId: aid,
        filename: fn || "spreadsheet.xlsx",
        mimeType: mt,
        size: part.body?.size,
      });
    }
    if (part.parts) collectExcelAttachments(part.parts, acc);
  }
  return acc;
}

export const fetchGmailEmails = async (
  accessToken: string,
  userId: string,
  maxResults = 20
): Promise<{ imported: number; errors: string[] }> => {

  const errors: string[] = [];
  let imported = 0;

  try {

    console.log("📥 Fetching Gmail messages...");

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listRes.ok) {

      const err = await listRes.text();

      throw new Error(`Gmail list error: ${listRes.status} ${err}`);

    }

    const listData = await listRes.json() as { messages?: GmailMessage[] };

    const messages = listData.messages || [];

    console.log("📨 Messages found:", messages.length);

    if (messages.length === 0) {
      return { imported: 0, errors: ["No emails found"] };
    }

    for (const msg of messages) {

      try {

        console.log("Processing:", msg.id);

        const exists = await Email.findOne({
          userId,
          emailId: msg.id
        });

        if (exists) {
          console.log("Skipped duplicate:", msg.id);
          continue;
        }

        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!detailRes.ok) {

          const err = await detailRes.text();

          errors.push(`Failed to fetch message ${msg.id} ${err}`);

          continue;

        }

        const detail = await detailRes.json() as GmailMessageDetail;

        const headers = detail.payload.headers;

        const getHeader = (name: string) =>
          headers.find(
            (h) => h.name.toLowerCase() === name.toLowerCase()
          )?.value || "";

        const from = getHeader("From");

        const subject = getHeader("Subject") || "(No Subject)";

        const body = extractBody(detail.payload);

        const receivedAt = new Date(
          Number(detail.internalDate || Date.now())
        );

        await Email.create({

          userId,

          emailId: detail.id,

          from,

          subject,

          body: body.substring(0, 5000),

          snippet: detail.snippet || body.substring(0, 150),

          receivedAt,

          isRead: !detail.labelIds.includes("UNREAD"),

          isProcessed: false,

          hasActionItems: false,

          extractedTaskIds: [],

          needsFollowUp: false,

          aiSummary: ""

        });

        const excelAttachments = collectExcelAttachments(detail.payload.parts);
        for (const att of excelAttachments) {
          try {
            await EmailAttachment.findOneAndUpdate(
              { userId, emailId: detail.id, attachmentId: att.attachmentId },
              { $set: { filename: att.filename, mimeType: att.mimeType, size: att.size } },
              { upsert: true, new: true }
            );
          } catch (e) {
            console.warn("Attachment save skipped:", att.filename, e);
          }
        }

        imported++;

      } catch (err) {

        console.error("Email import error:", err);

        errors.push(`Error processing message ${msg.id}`);

      }

    }

    console.log("✅ Imported:", imported);

    console.log("❌ Errors:", errors.length);

    return { imported, errors };

  } catch (error) {

    console.error("Gmail fetch failed:", error);

    throw new Error(`Gmail fetch failed: ${error}`);

  }

};