import dotenv from 'dotenv';    
import mongoose from "mongoose";
import Role from "../models/Role.js";

dotenv.config();    

const seedRoles = async () => {
    try{
        const mongoUri = process.env.MONGODB_URI;
        console.log("uri :: ", mongoUri);
        
        if(!mongoUri){
            throw new Error("Mongo_URI Missing");
        }

        await mongoose.connect(mongoUri);

        const roleName = "GLOBAL_ADMIN";
        const permissions = ["role:create"];

        const existing = await Role.findOne({
            name : roleName
        });

        if(existing){
            existing.permissions = permissions;
            await existing.save();
            console.log("Role Updated");
        }else{
            await Role.create({
                name : roleName, permissions
            });
            console.log("Role Created");
        };

        console.log("Seed completed");
        process.exit(0);

    }catch(error){
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
}

seedRoles();