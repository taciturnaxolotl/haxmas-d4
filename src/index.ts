import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	createSnowflake,
	deleteSnowflake,
	getSnowflake,
	listSnowflakes,
	meltSnowflake,
} from "./db/queries";

const app = new OpenAPIHono();

const SnowflakeSchema = z
	.object({
		id: z.number().openapi({ example: 1 }),
		pattern: z.string().openapi({ example: "  *  \n * * \n*   *\n * * \n  *  " }),
		size: z.number().openapi({ example: 5 }),
		melted: z.number().openapi({ example: 0 }),
		createdAt: z.number().openapi({ example: 1734123456 }),
	})
	.openapi("Snowflake");

const ErrorSchema = z
	.object({
		error: z.string().openapi({ example: "not found" }),
	})
	.openapi("Error");

const SuccessSchema = z
	.object({
		ok: z.boolean().openapi({ example: true }),
	})
	.openapi("Success");

const StyleEnum = z.enum(["classic", "dense", "minimal", "mixed"]);

const listRoute = createRoute({
	method: "get",
	path: "/api/snowflakes",
	tags: ["Snowflakes"],
	summary: "List all snowflakes",
	description: "Returns a list of all snowflakes ordered by ID descending",
	responses: {
		200: {
			content: { "application/json": { schema: z.array(SnowflakeSchema) } },
			description: "List of snowflakes",
		},
	},
});

const getRoute = createRoute({
	method: "get",
	path: "/api/snowflakes/{id}",
	tags: ["Snowflakes"],
	summary: "Get a snowflake by ID",
	description: "Returns a single snowflake by its ID",
	request: {
		params: z.object({
			id: z.string().pipe(z.coerce.number()).openapi({ param: { name: "id", in: "path" }, example: "1" }),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: SnowflakeSchema } },
			description: "The snowflake",
		},
		400: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Invalid ID",
		},
		404: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Snowflake not found",
		},
	},
});

const renderRoute = createRoute({
	method: "get",
	path: "/api/snowflakes/{id}/render",
	tags: ["Snowflakes"],
	summary: "Render a snowflake as ASCII art",
	description: "Returns the snowflake pattern as plain text",
	request: {
		params: z.object({
			id: z.string().pipe(z.coerce.number()).openapi({ param: { name: "id", in: "path" }, example: "1" }),
		}),
	},
	responses: {
		200: {
			content: { "text/plain": { schema: z.string() } },
			description: "ASCII art representation of the snowflake",
		},
		400: {
			content: { "text/plain": { schema: z.string() } },
			description: "Invalid ID",
		},
		404: {
			content: { "text/plain": { schema: z.string() } },
			description: "Snowflake not found",
		},
	},
});

const createRoute_ = createRoute({
	method: "post",
	path: "/api/snowflakes",
	tags: ["Snowflakes"],
	summary: "Create a new snowflake",
	description: "Generates a new procedural snowflake with optional parameters",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z
						.object({
							size: z.number().min(1).max(20).optional().openapi({ example: 11 }),
							seed: z.string().optional().openapi({ example: "my-unique-seed" }),
							style: StyleEnum.optional().openapi({ example: "classic" }),
						})
						.openapi("CreateSnowflakeRequest"),
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: z
						.object({
							id: z.number().openapi({ example: 1 }),
							seed: z.string().openapi({ example: "my-unique-seed" }),
							style: StyleEnum.openapi({ example: "classic" }),
						})
						.openapi("CreateSnowflakeResponse"),
				},
			},
			description: "Snowflake created",
		},
		400: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Invalid parameters",
		},
	},
});

const meltRoute = createRoute({
	method: "patch",
	path: "/api/snowflakes/{id}/melt",
	tags: ["Snowflakes"],
	summary: "Melt a snowflake",
	description: "Marks a snowflake as melted",
	request: {
		params: z.object({
			id: z.string().pipe(z.coerce.number()).openapi({ param: { name: "id", in: "path" }, example: "1" }),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: SuccessSchema } },
			description: "Snowflake melted",
		},
		400: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Invalid ID",
		},
		404: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Snowflake not found",
		},
	},
});

const deleteRoute = createRoute({
	method: "delete",
	path: "/api/snowflakes/{id}",
	tags: ["Snowflakes"],
	summary: "Delete a snowflake",
	description: "Permanently removes a snowflake",
	request: {
		params: z.object({
			id: z.string().pipe(z.coerce.number()).openapi({ param: { name: "id", in: "path" }, example: "1" }),
		}),
	},
	responses: {
		200: {
			content: { "application/json": { schema: SuccessSchema } },
			description: "Snowflake deleted",
		},
		400: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Invalid ID",
		},
		404: {
			content: { "application/json": { schema: ErrorSchema } },
			description: "Snowflake not found",
		},
	},
});

app.openapi(listRoute, (c) => {
	return c.json(listSnowflakes(), 200);
});

app.openapi(getRoute, (c) => {
	const id = c.req.valid("param").id;
	if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);

	const snowflake = getSnowflake(id);
	if (!snowflake) return c.json({ error: "not found" }, 404);

	return c.json(snowflake, 200);
});

app.openapi(renderRoute, (c) => {
	const id = c.req.valid("param").id;
	if (!Number.isFinite(id)) return c.text("Invalid snowflake ID", 400);

	const snowflake = getSnowflake(id);
	if (!snowflake) return c.text("Snowflake not found", 404);

	return c.text(snowflake.pattern, 200);
});

app.openapi(createRoute_, async (c) => {
	const body = c.req.valid("json");
	const size = body.size;
	const seed = body.seed;
	const style = body.style;

	if (size !== undefined && (!Number.isFinite(size) || size < 1 || size > 20)) {
		return c.json({ error: "size must be between 1 and 20" }, 400);
	}

	if (style && !["classic", "dense", "minimal", "mixed"].includes(style)) {
		return c.json(
			{ error: "style must be one of: classic, dense, minimal, mixed" },
			400,
		);
	}

	return c.json(createSnowflake(size, seed, style), 201);
});

app.openapi(meltRoute, (c) => {
	const id = c.req.valid("param").id;
	if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);

	const res = meltSnowflake(id);
	if (res.changes === 0) return c.json({ error: "not found" }, 404);

	return c.json({ ok: true }, 200);
});

app.openapi(deleteRoute, (c) => {
	const id = c.req.valid("param").id;
	if (!Number.isFinite(id)) return c.json({ error: "bad id" }, 400);

	const res = deleteSnowflake(id);
	if (res.changes === 0) return c.json({ error: "not found" }, 404);

	return c.json({ ok: true }, 200);
});

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		title: "Snowflake API",
		version: "1.0.0",
		description: "A festive API for generating and managing procedural ASCII snowflakes ❄️",
	},
	tags: [
		{
			name: "Snowflakes",
			description: "Operations for creating, viewing, and managing snowflakes",
		},
	],
});

app.get("/", swaggerUI({ url: "/doc" }));

const port = Number(process.env.PORT) || 3000;

export default {
	port,
	fetch: app.fetch,
};
