import { OrganizationRepository } from "../repositories/organizationRepositories.js";

export class OrganizationService {
  
  constructor({ organizationRepository = new OrganizationRepository() } = {}) {
    this.organizationRepository = organizationRepository;
  }

  slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async createOrganization({ name, createdBy }) {
    if (!name || name.trim().length < 2) {
      const err = new Error("Organization name must be at least 2 characters");
      err.statusCode = 400;
      throw err;
    }

    if (!createdBy) {
      const err = new Error("createdBy is required");
      err.statusCode = 400;
      throw err;
    }

    const slug = this.slugify(name);
    const existing = await this.organizationRepository.findBySlug(slug);
    if (existing) {
      const err = new Error("Organization with this name/slug already exists");
      err.statusCode = 409;
      throw err;
    }

    return this.organizationRepository.create({
      name: name.trim(),
      slug,
      createdBy,
      status: "active",
    });
  }
  
}
