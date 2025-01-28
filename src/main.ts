import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { compress } from 'hono/compress'
import { Liquid } from "liquidjs";


const liquid = new Liquid({
  root: [path.resolve(import.meta.dirname, "../templates")],
  extname: ".liquid",
  cache: true,
});

const app = new Hono();

// app.use(compress());

app.use("/assets/**", serveStatic({ root: "./" }));
app.use("/node_modules/@joist/**", serveStatic({ root: "./" }));
app.use("/node_modules/tslib/**", serveStatic({ root: "./" }));
app.use("/target/components/**", serveStatic({ root: "./" }));

app.get("/", (ctx) => {
  return stream(ctx, async (stream) => {
    ctx.res.headers.set("Content-Type", "text/html; charset=utf8");
    ctx.res.headers.set("Transfer-Encoding", "chunked");

    await stream.writeln(await liquid.renderFile("views/dashboard"));

    const slots = [1, 2, 3, 4, 5, 6]
    
    slots.sort(() => Math.floor(Math.random() * 100) - Math.floor(Math.random() * 100));
    
    for(const slot of slots) {
      await stream.sleep(Math.floor(Math.random() * (1000 - 500 + 1) + 500));
      await stream.writeln(/*html*/`<div slot="content-${slot}">HELLO WORLD - ${slot}</div>`)
    }

    stream.close();
  });
});

serve({
  fetch: app.fetch,
  port: 4200,
});
