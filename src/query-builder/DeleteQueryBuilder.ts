import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ObjectType} from "../common/ObjectType";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class DeleteQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any>, queryRunner?: QueryRunner) {
        super(connectionOrQueryBuilder as any, queryRunner);
        this.expressionMap.aliasNamePrefixingEnabled = false;
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createDeleteExpression();
        return sql.trim();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: ObjectType<T>|string, aliasName?: string): DeleteQueryBuilder<T> {
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as DeleteQueryBuilder<T>;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string, parameters?: ObjectLiteral): this;

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: (qb: this) => string, parameters?: ObjectLiteral): this;

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string|((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = [{ type: "simple", condition: typeof where === "string" ? where : where(this) }];
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string, parameters?: ObjectLiteral): this;

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: (qb: this) => string, parameters?: ObjectLiteral): this;

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string|((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "and", condition: typeof where === "string" ? where : where(this) });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string, parameters?: ObjectLiteral): this;

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: (qb: this) => string, parameters?: ObjectLiteral): this;

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string|((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "or", condition: typeof where === "string" ? where : where(this) });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.where(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.andWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any[]): this {
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.orWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Optional returning/output clause.
     */
    returning(returning: string): this {
        if (this.connection.driver instanceof SqlServerDriver || this.connection.driver instanceof PostgresDriver) {
            this.expressionMap.returning = returning;
            return this;
        } else throw new Error("OUTPUT or RETURNING clause only supported by MS SQLServer or PostgreSQL");
    }

    /**
     * Optional returning/output clause.
     */
    output(output: string): this {
         return this.returning(output);
    }
    
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates DELETE express used to perform query.
     */
    protected createDeleteExpression() {
        const tableName = this.escape(this.getMainTableName());
        const whereExpression = this.createWhereExpression();
        if (this.expressionMap.returning !== "" && this.connection.driver instanceof PostgresDriver) {
            return `DELETE FROM ${tableName}${whereExpression} RETURNING ${this.expressionMap.returning}`;
        } else if (this.expressionMap.returning !== "" && this.connection.driver instanceof SqlServerDriver) {
            return `DELETE FROM ${tableName} OUTPUT ${this.expressionMap.returning}${whereExpression}`;
        } else {
            return `DELETE FROM ${tableName}${whereExpression}`; // todo: how do we replace aliases in where to nothing?
        }
    }

}
