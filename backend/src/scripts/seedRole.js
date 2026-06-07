import dotenv from 'dotenv';    
import mongoose from "mongoose";
import Role from "../models/Role.js";
import { ROLES } from "../constants/roles.js";

dotenv.config();    

const seedRoles = async () => {
    try{
        const mongoUri = process.env.MONGODB_URI;
        console.log("uri :: ", mongoUri);
        
        if(!mongoUri){
            throw new Error("Mongo_URI Missing");
        }

        await mongoose.connect(mongoUri);

        const roleNames = Object.values(ROLES);
        for (const roleName of roleNames) {
            const existing = await Role.findOne({
                name: roleName
            });

            if (existing) {
                console.log(`Role exists: ${roleName}`);
                continue;
            }

            await Role.create({
                name: roleName
            });
            console.log(`Role created: ${roleName}`);
        }

        console.log("Seed completed");
        process.exit(0);

    }catch(error){
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
}

seedRoles();
