/**
 * Migration Script: Update Founder Role to Owner
 * 
 * This script updates existing users with 'founder' role to 'owner' role
 * Run this after deploying the new authentication system
 * 
 * Usage:
 * ts-node src/scripts/migrateFounderToOwner.ts
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findassure';

async function migrateFounderToOwner() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all users with 'founder' role
    const foundersCount = await User.countDocuments({ role: 'founder' });
    console.log(`\n📊 Found ${foundersCount} users with 'founder' role`);

    if (foundersCount === 0) {
      console.log('✅ No migration needed - all users are already updated!');
      return;
    }

    // Update all founders to owners
    const result = await User.updateMany(
      { role: 'founder' as any }, // Cast to any to bypass TypeScript validation
      { $set: { role: 'owner' } }
    );

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated ${result.modifiedCount} users from 'founder' to 'owner'`);

    // Verify the migration
    const remainingFounders = await User.countDocuments({ role: 'founder' as any });
    if (remainingFounders === 0) {
      console.log('✅ Verification passed - no founders remaining');
    } else {
      console.log(`⚠️  Warning: ${remainingFounders} founders still remain`);
    }

    // Show updated role distribution
    const ownerCount = await User.countDocuments({ role: 'owner' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log('\n📊 Current role distribution:');
    console.log(`   Owners: ${ownerCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Total:  ${ownerCount + adminCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateFounderToOwner()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateFounderToOwner };
