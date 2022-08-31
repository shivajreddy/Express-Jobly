"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a Job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyHandleCheck = await db.query(
      `SELECT company_handle
            FROM jobs
            WHERE company_handle = $1`,
      [companyHandle]
    );
    if (!companyHandleCheck.rows[0])
      throw new NotFoundError(
        `No company found with given companyHandle: ${companyHandle}`
      );

    const result = await db.query(
      `INSERT INTO jobs
          ( title, salary, equity, company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id,title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(`SELECT * FROM jobs ORDER BY id`);
    return companiesRes.rows;
  }

  /** Given a job id, return data about that job.
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if no job of given id is found
   **/

  static async get(id) {
    const jobRes = await db.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
    const job = jobRes.rows[0];
    if (!job) throw new NotFoundError(`No job with id : ${id}`);
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if no job is found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${id} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
