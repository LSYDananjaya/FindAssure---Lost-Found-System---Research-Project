import admin from '../config/firebaseAdmin';
import { User } from '../models/User';
import mongoose from 'mongoose';

/**
 * Cleanup script to delete users from both Firebase and MongoDB
 * Usage: npx ts-node src/scripts/cleanupUsers.ts <email>
 * Or: npx ts-node src/scripts/cleanupUsers.ts --all (deletes all non-admin users)
 */

const cleanupUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lost-found';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('Usage:');
      console.log('  Delete specific user: npx ts-node src/scripts/cleanupUsers.ts <email>');
      console.log('  Delete all non-admin: npx ts-node src/scripts/cleanupUsers.ts --all');
      process.exit(0);
    }

    if (args[0] === '--all') {
      // Delete all non-admin users
      console.log('🗑️  Deleting all non-admin users...');
      
      const users = await User.find({ role: { $ne: 'admin' } });
      console.log(`Found ${users.length} non-admin users`);

      for (const user of users) {
        try {
          // Delete from Firebase
          await admin.auth().deleteUser(user.firebaseUid);
          console.log(`✅ Deleted from Firebase: ${user.email}`);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log(`⚠️  User not found in Firebase: ${user.email}`);
          } else {
            console.error(`❌ Error deleting from Firebase: ${user.email}`, error.message);
          }
        }

        // Delete from MongoDB
        await User.deleteOne({ _id: user._id });
        console.log(`✅ Deleted from MongoDB: ${user.email}`);
      }

      console.log(`\n✅ Cleanup complete! Deleted ${users.length} users.`);
    } else {
      // Delete specific user by email
      const email = args[0];
      console.log(`🗑️  Deleting user: ${email}`);

      // Find user in MongoDB
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log('❌ User not found in MongoDB');
      } else {
        // Delete from Firebase
        try {
          await admin.auth().deleteUser(user.firebaseUid);
          console.log('✅ Deleted from Firebase');
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log('⚠️  User not found in Firebase');
          } else {
            throw error;
          }
        }

        // Delete from MongoDB
        await User.deleteOne({ _id: user._id });
        console.log('✅ Deleted from MongoDB');
      }

      // Also try to delete from Firebase by email if not found in MongoDB
      if (!user) {
        try {
          const firebaseUser = await admin.auth().getUserByEmail(email);
          await admin.auth().deleteUser(firebaseUser.uid);
          console.log('✅ Deleted from Firebase');
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log('❌ User not found in Firebase either');
          } else {
            throw error;
          }
        }
      }

      console.log('\n✅ Cleanup complete!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanupUsers();
