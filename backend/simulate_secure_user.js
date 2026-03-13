const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/axon');
        const userSchema = new mongoose.Schema({
            email: String,
            gmailToken: String,
            externalServices: {
                gmail: {
                    connected: Boolean
                }
            }
        }, { strict: false });
        
        const User = mongoose.model('User', userSchema);
        
        const result = await User.findOneAndUpdate(
            { email: 'testuser@example.com' }, 
            { 
                gmailToken: 'mock_token_for_verification',
                'externalServices.gmail.connected': true 
            },
            { new: true }
        );
        
        if (result) {
            console.log('Successfully simulated SECURE user: ' + result.email);
        } else {
            console.log('User not found: testuser@example.com');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
