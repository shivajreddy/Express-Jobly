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

const jobFilterSchema = require("../schemas/jobFilter.json");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 * id should be auto-generated
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    console.log(
      "validation result = ",
      validator.valid,
      "because body is",
      req.body
    );
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   Get all jobs
 *   { jobs: [{ id, title, salary, equity, companyHandle }]}
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const jobs = await Job.findAll();

    const validator = jsonschema.validate(req.body, jobFilterSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const { title, minSalary, maxSalary, hasEquity } = req.body;
    if (title) {
      const filteredJobs = jobs.filter((j) =>
        j.title.toLowerCase().includes(title.toLowerCase())
      );
      return res.json({ filteredJobs });
    }
    // if (companyHandle) {
    //   const filteredJobs = jobs.filter(
    //     (j) => j.company_handle.toLowerCase() === companyHandle.toLowerCase()
    //   );
    //   console.log("this is wtf", companyHandle, filteredJobs);
    //   return res.json({ filteredJobs });
    // }
    if (minSalary && maxSalary) {
      if (minSalary >= maxSalary)
        throw new ExpressError(
          `Minimum salary:${minSalary} should be lower than maximum salary:${maxSalary}`,
          400
        );
      const filteredJobs = jobs.filter(
        (j) => j.salary && j.salary > minSalary && j.salary < maxSalary
      );
      if (filteredJobs.length === 0)
        throw new NotFoundError(
          `No Jobs found with min: ${minSalary} and max:${maxSalary}`
        );
      return res.json({ filteredJobs });
    }
    // Only minSalary is given
    if (minSalary) {
      const filteredJobs = jobs.filter((j) => j.salary && j.salary > minSalary);
      if (filteredJobs.length === 0)
        throw new NotFoundError(`No Jobs found with min: ${minSalary}`);
      return res.json({ filteredJobs });
    }
    // Only minSalary is given
    if (maxSalary) {
      const filteredJobs = jobs.filter((j) => j.salary && j.salary < maxSalary);
      if (filteredJobs.length === 0)
        throw new NotFoundError(`No Jobs found with max: ${maxSalary}`);
      return res.json({ filteredJobs });
    }
    if (hasEquity) {
      const filteredJobs = jobs.filter((j) => j.equity && j.equity > 0);
      if (filteredJobs.length === 0)
        throw new NotFoundError(`No Jobs found with equity: ${equity}`);
      return res.json({ total: filteredJobs.length, filteredJobs });
    }

    // Custom filtering
    const filteredJobs = jobs.filter((j) => j.name);

    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
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
 * Authorization required: Admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
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

/** DELETE /[id]  =>  { deleted: id}
 *
 * Authorization: Admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.id);
    // await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
