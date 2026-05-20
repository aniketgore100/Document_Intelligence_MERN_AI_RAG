import Organization from "../models/Organization.js";

export class OrganizationRepository{

    async findBySlug(slug){
        return Organization.findOne({slug});
    }

    async create(data, options = {}){
        const org = await Organization.create([data], options);
        return org[0];
    }

    async findById(id){
        return Organization.findById(id);
    }

    async list({status = "active", limit = 20, skip = 0} = {}){
        return Organization.find({status}).sort({createdAt : -1}).skip(skip).limit(limit);
    }
}