# Entities

* [What is Entity?](#what-is-entity)
* [Entity columns](#entity-columns)
    * [Primary columns](#primary-columns)
    * [Special columns](#special-columns)
    * [Embedded columns](#embedded-columns)
* [Column types](#column-types)
    * [Column types for `mysql` / `mariadb`](#column-types-for-mysql--mariadb)
    * [Column types for `postgres`](#column-types-for-postgres)
    * [Column types for `sqlite` / `websql`](#column-types-for-sqlite--websql)
    * [Column types for `mssql`](#column-types-for-mssql)
    * [`simple-array` column type](#simple-array-column-type)
    * [Columns with generated values](#columns-with-generated-values)
* [Column options](#column-options)
* [Entity inheritance](#entity-inheritance)
* [Tree entities](#tree-entities)
    * [Adjacency list](#adjacency-list)
    * [Closure table](#closure-table)

## What is Entity?

Entity is a class that maps into database table (or collection for MongoDB database).
You can create entity by defining a new class and mark with special orm decorator:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;
    
}
```

This will create following database table:

```shell
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| firstName   | varchar(255) |                            |
| lastName    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+
```

Basic entity consist of columns and relations. 
Each entity **MUST** have a primary column (or ObjectId column if are using MongoDB).

Each entity must be registered in your connection options this way:

```typescript
import {createConnection, Connection} from "typeorm";
import {User} from "./entity/User";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [User]
});
```

Or you can specify the whole directory with all entities inside - and all of them will be loaded:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: ["entity/*.js"]
});
```

If you want to use alternative table name for `User` entity you can specify it in `@Entity` decorator: `@Entity("my_users")`.
If you want to set base prefix for all database tables in your application you can specify `entityPrefix` in connection options.

## Entity columns

Since database table consist of columns your entities must consist of columns too. 
Each entity class properties you marked with `@Column` decorator will be mapped to database table columns.

### Primary columns

Each entity must have at least one primary column.
There are several types of primary columns:

* `@PrimaryColumn()` creates a primary column which take any value of any type.
You can specify column type. If you don't specify a column type it will be inferred from property type.
Example below will create id with `int` type which you must manually assign before save.

```typescript
import {Entity, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
    
   
}
```

* `@PrimaryGeneratedColumn()` creates a primary column which value will be automatically generated with auto-increment value.
It will create `int` column with `auto-increment`/`serial`/`sequence` (depend on the database).
You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import {Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
   
}
```

* `@PrimaryGeneratedColumn("uuid")` creates a primary column which value will be automatically generated with `uuid`.
Uuid is a unique string id.
You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import {Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
   
}
```

You can have composite primary columns as well:

```typescript
import {Entity, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryColumn()
    firstName: string;
    
    @PrimaryColumn()
    lastName: string;
    
}
```

When you save entities using `save` method it always tries to find entity in the database by given entity id (or ids).
If id/ids are found then it will update this row in database. 
If there is no row with such id / ids new row will be inserted.
 
To find entity by id you can use `manager.findOneById` or `repository.findOneById` methods. Example:

```typescript
// find one by id with single primary key
const person = await connection.manager.findOneById(Person, 1);
const person = await connection.getRepository(Person).findOneById(1);

// find one by id with composite primary keys
const user = await connection.manager.findOneById(User, { firstName: "Umed", lastName: "Khudoiberdiev" });
const user = await connection.getRepository(User).findOneById({ firstName: "Umed", lastName: "Khudoiberdiev" });
```

### Special columns

There are several special column types with additional functionality available:

* `@CreateDateColumn` is a special column that automatically sets entity insertion time.
You don't need to write a value into this column - it will be automatically set.

* `@UpdateDateColumn` is a special column that automatically sets entity updating time 
each time you call `save` method of entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

* `@VersionColumn` is a special column that automatically sets entity version (incremental number)  
each time you call `save` method of entity manager or repository.
You don't need to write a value into this column - it will be automatically set.

### Embedded columns

There is an amazing way to reduce duplication in your app (using composition over inheritance) by using `embedded columns`.
Embedded column is a column which accepts a class with its own columns and merges those classes into current entity's database table.
Example:

Let's say we have `User`, `Employee` and `Student` entities.
All those entities have few things in common - `first name` and `last name` properties

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    nameFirst: string;
    
    @Column()
    nameLast: string;
    
    @Column()
    isActive: boolean;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Employee {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    nameFirst: string;
    
    @Column()
    nameLast: string;
    
    @Column()
    salary: string;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Student {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    nameFirst: string;
    
    @Column()
    nameLast: string;
    
    @Column()
    faculty: string;
    
}
```

What we can do is to reduce `firstName` and `lastName` duplication by creating a new class with those columns:

```typescript
import {Entity, Column} from "typeorm";

export class Name {
    
    @Column()
    first: string;
    
    @Column()
    last: string;
    
}
```

Then you can "connect" those columns in your entities: 

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    isActive: boolean;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class Employee {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    salary: number;
    
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";
import {Name} from "./Name";

@Entity()
export class Student {
    
    @PrimaryGeneratedColumn()
    id: string;
    
    @Column(type => Name)
    name: Name;
    
    @Column()
    faculty: string;
    
}
```

All columns defined in `Name` entity will be merged into `user`, `employee` and `student` tables:

```shell
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                        employee                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| salary      | int(11)      |                            |
+-------------+--------------+----------------------------+

+-------------+--------------+----------------------------+
|                         student                         |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| nameFirst   | varchar(255) |                            |
| nameLast    | varchar(255) |                            |
| faculty     | varchar(255) |                            |
+-------------+--------------+----------------------------+
```

This way we reduced duplication in classes.
 You can use as many columns (or relations) in embedded classes as you need.
 You even can have nested embedded columns inside embedded classes.
 
## Column types

TypeORM supports all the most commonly used database-supported column types.
Column types are database-type specific - this provides more flexibility on how your database schema will look like.
 
You can specify column type as first parameter of `@Column` decorator
or in column options of `@Column` decorator, for example:

```typescript
@Column("int")
```

or 
 
```typescript
@Column({ type: "int" })
```

If you want to specify additional type parameters you can do it via column options.
For example:

```typescript
@Column("varchar", { length: 200 })
```

or 
 
```typescript
@Column({ type: "int", length: 200 })
```

### Column types for `mysql` / `mariadb`

`int`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`, `float`, `double`, 
`decimal`, `real`, `datetime`, `time`, `timestamp`, `int`, `tinyint`, `smallint`, `mediumint`, `bigint`, 
`character`, `varchar`, `char`, `tinyblob`, `tinytext`, `mediumblob`, `mediumtext`, `blob`, `text`, 
`longblob`, `longtext`, `date`, `year`, `enum`, `json`

### Column types for `postgres`

`int2`, `int2`, `int4`, `int8`, `integer`, `smallint`, `bigint`, `decimal`, `numeric`, `decimal`, 
`numeric`, `real`, `double precision`, `time`, `time with time zone`, `time without time zone`,
`timestamp`, `timestamp without time zone`, `timestamp with time zone`, `int`, `smallint`, `bigint`,
`character varying`, `character`, `varchar`, `char`, `int2`, `integer`, `int4`, `int8`, 
`float4`, `float8`, `smallserial`, `serial2`, `serial`, `serial4`, `bigserial`, `serial8`, 
`money`, `boolean`, `bool`, `text`, `bytea`, `date`, `interval`, `point`, `line`, `lseg`, `box`, 
`circle`, `path`, `polygon`, `enum`, `cidr`, `inet`, `macaddr`, `bit`, `bit varying`,
 `varbit`, `tsvector`, `tsquery`, `uuid`, `xml`, `json`, `jsonb` 

### Column types for `sqlite` / `websql`

`int`, `int2`, `int2`, `int8`, `integer`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`,
`numeric`, `float`, `double`, `decimal`, `numeric`, `real`, `double precision`, `datetime`, 
`int`, `tinyint`, `smallint`, `mediumint`, `bigint`, `varying character`, `character`, `native character`, 
`varchar`, `nchar`, `nvarchar2`, `int2`, `integer`, `int8`, `unsigned big int`, `boolean`, 
`blob`, `text`, `clob`, `date`
 
### Column types for `mssql`

`int`, `tinyint`, `smallint`, `bigint`, `dec`, `decimal`, `numeric`, `float`, `dec`, `decimal`, 
`numeric`, `real`, `datetime`, `datetime2`, `datetimeoffset`, `time`, `timestamp`, 
`int`, `tinyint`, `smallint`, `bigint`, `nvarchar`, `varchar`, `char`, `nchar`, `binary`, `varbinary`,
`bit`, `smallmoney`, `money`, `text`, `ntext`, `image`, `smalldatetime`, `date`, `xml`, `varbinary`,
`cursor`, `hierarchyid`, `sql_variant`, `table`
  
### `simple-array` column type

There is a special column type called `simple-array` which can store primitive array values in a single string column.
All values are separated by a comma. For example:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column("simple-array")
    names: string[];
    
}
```
```typescript
const user = new User();
user.names = [
    "Alexander",
    "Alex",
    "Sasha",
    "Shurik"
];
```

Will be stored in a single database column as `Alexander,Alex,Sasha,Shurik` value.
When you'll load data from the database names will be returned as an array of names, 
just like you stored them.

Note you MUST NOT have any comma in values you write.

### Columns with generated values

You can create column with generated value using `@Generated` decorator. For example:

```typescript
@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
 
    @Column()
    @Generated("uuid")
    uuid: string;
    
}
```

`uuid` value will be automatically generated and stored into the database.
 
Besides "uuid" there is also "increment" generated type, however there are some limitations 
on some database platforms with this type of generation (for example some databases can only have one increment column,
or some of them require increment to be a primary key). 
 
## Column options

Column options defines additional options for your entity columns.
You can specify column options into `@Column` decorator:

```typescript
@Column({
    type: "varchar",
    length: 150,
    unique: true,
    // ...
})
name: string;
```

List of available options in `ColumnOptions`:

* `type: ColumnType` - Column type. One of the type listed [above](#column-types).
* `name: string` - Column name in the database table. 
By default database table name is generated from the decorated with @Column property name.
You can change it by specifying your own name
* `length: number` - Column type's length. For example if you want to create `varchar(150)` type 
you specify column type and length options.
* `nullable: boolean` - Makes column `NULL` or `NOT NULL` in the database. 
By default column is `nullable: false`.
* `default: string` - Adds database-level column's `DEFAULT` value. 
* `primary: boolean` - Marks column as primary. Same if you use `@PrimaryColumn` decorator.
* `unique: boolean` - Marks column as unique column (creates index). Same if you use `@Index` decorator.
* `comment: string` - Database's column comment. Not supported by all database types.
* `precision: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
 number of digits that are stored for the values. Used in some column types.
* `scale: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), 
which represents the number of digits to the right of the decimal point and must not be greater than precision. 
Used in some column types.
* `charset: string` - Defines a column character set. Not supported by all database types.
* `collation: string` - Defines a column collation.
* `enum: string[]|AnyEnum` - Used in `enum` column type to specify list of allowed enum values.
You can specify array of values or specify a enum class.
* `array: boolean` - Used for postgres column types which can be array (for example int[])

Note: most of those column options are RDBMS-specific and aren't available in `MongoDB`.

## Entity inheritance

You can reduce duplication in your code by using entity inheritance. 

For example, you have `Photo`, `Question`, `Post` entities:
  
```typescript
@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    size: string;
    
}

@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    viewCount: number;
    
}
```

As you can see all those entities have some common columns: `id`, `title`, `description`.
To reduce duplication and produce a better abstraction we can create a base class called `Content` for them:


```typescript
export abstract class Content {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
}
@Entity()
export class Photo extends Content {
    
    @Column()
    size: string;
    
}

@Entity()
export class Question extends Content {
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post extends Content {
    
    @Column()
    viewCount: number;
    
}
```

All columns (relations, embeds, etc.) from parent entities (parent can extend other entity as well)
will be inherited and created in final entities.

## Tree entities

TypeORM supports Adjacency list and Closure table patterns of storing tree structures.

### Adjacency list

Adjacency list is a simple model with self-referencing. 
Benefit of this approach is simplicity, 
drawback is you can't load big tree in once because of joins limitation.
Example:

```typescript
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(type => Category, category => category.children)
    parent: Category;

    @ManyToOne(type => Category, category => category.parent)
    children: Category;
}
     
```

### Closure table


Closure table stores relations between parent and child in a separate table in a special way. 
Its efficient in both reads and writes. 
To learn more about closure table take a look at this awesome presentation by Bill Karwin. 
Example:

```typescript
import {ClosureEntity, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@ClosureEntity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @TreeChildren()
    children: Category;

    @TreeParent()
    parent: Category;

    @TreeLevelColumn()
    level: number;
}
```