"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const {
  BadRequestError,
  ExpressError,
  NotFoundError,
} = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

// const companyNewSchema = require("../schemas/companyNew.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");
// const companyFilterSchema = require("../schemas/companyFilter.json");

// const jobNewSchema = require("../schemas/jobFilter.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** GET /  =>
 *   { jobs: [{ id, title, salary, equity, companyHandle }]}
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const jobs = await Job.findAll();
    console.log("these are the jobs i got", jobs);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { id, title, salary, equity, companyHandle }
 *
 * Returns {}
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  console.log("at this patch route");
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
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
