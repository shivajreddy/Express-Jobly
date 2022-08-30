"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const {
  BadRequestError,
  ExpressError,
  NotFoundError,
} = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyFilterSchema = require("../schemas/companyFilter.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyFilterSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const { name, minEmployees, maxEmployees } = req.body;
    const companies = await Company.findAll();
    if (name) {
      const filteredCompany = companies.filter((c) => c.name === name);
      if (!filteredCompany)
        return new NotFoundError(`No Company found with name: ${name}`);
      return res.json({ filteredCompany });
    }
    //! TESTING
    console.log("LOCALS");
    console.log(req.user, res.locals, req.header);
    console.log("res.locals.user = ", res.locals.user);

    //! TESTING
    // Both minEmployees an maxEmployees are given
    if (minEmployees && maxEmployees) {
      // Allow only if minEmployees < maxEmployees
      if (minEmployees >= maxEmployees) {
        throw new ExpressError(
          `Minimum employees:${minEmployees} should be lower than maximum employees:${maxEmployees}`,
          400
        );
      }
      const filteredCompanies = companies.filter(
        (c) => c.numEmployees > minEmployees && c.numEmployees < maxEmployees
      );
      if (filteredCompanies.length === 0)
        throw new NotFoundError(
          `No Companies found with range: ${minEmployees} - ${maxEmployees}`
        );
      return res.json({ filteredCompanies });
    }
    // Only minEmployees is given
    if (minEmployees) {
      const filteredCompanies = companies.filter(
        (c) => c.numEmployees > minEmployees
      );
      if (filteredCompanies.length === 0)
        throw new NotFoundError(`No Companies found with min: ${minEmployees}`);
      return res.json({ filteredCompanies });
    }
    // Only maxEmployees is given
    if (maxEmployees) {
      const filteredCompanies = companies.filter(
        (c) => c.numEmployees < maxEmployees
      );
      if (filteredCompanies.length === 0)
        throw new NotFoundError(`No Companies found with max: ${maxEmployees}`);
      return res.json({ filteredCompanies });
    }
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
