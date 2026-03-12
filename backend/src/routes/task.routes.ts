import { Router } from "express";
import {
  getAllTasks, createTask, updateTask,
  deleteTask, updateTaskStage, getStats
} from "../controllers/task.controller";

const router = Router();
router.get("/", getAllTasks);
router.get("/stats", getStats);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/stage", updateTaskStage);
router.delete("/:id", deleteTask);

export default router;
