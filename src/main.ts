import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { Liquid } from "liquidjs";


const app = new Hono();

const liquid = new Liquid({
  root: [path.resolve(import.meta.dirname, "../templates")],
  extname: ".liquid",
  cache: true,
});

app.use("/assets/**", serveStatic({ root: "./" }));
app.use("/node_modules/@joist/**", serveStatic({ root: "./" }));
app.use("/node_modules/tslib/**", serveStatic({ root: "./" }));
app.use("/target/components/**", serveStatic({ root: "./" }));

app.get("/", (ctx) => {
  return stream(ctx, async (stream) => {
    ctx.res.headers.set("Content-Type", "text/html; charset=utf8");
    ctx.res.headers.set("Transfer-Encoding", "chunked");

    await stream.writeln(await liquid.renderFile("layouts/base"));

    await stream.writeln(
      await getTopStories().then((items) => {
        return liquid.renderFile("partials/history-items", {
          items,
        });
      })
    );

    stream.close();
  });
});

serve({
  fetch: app.fetch,
  port: 4200,
});

function getTopStories() {
  return fetch(`https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty&limitToFirst=50&orderBy="$key"`)
    .then<string[]>((res) => res.json())
    .then<any[]>((res) => {
      return Promise.all(
        res.map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
            (res) => res.json()
          )
        )
      );
    });
}
