import { Hono } from "hono";
import { apiRequestJson } from "../helpers/apiRequestRawHtml";

const searchV2 = new Hono();

searchV2.get("/", async (c) => {
  try {
    let query = c.req.query("query");
    if (!query) throw new Error("Query param is required");

    let data = await apiRequestJson(
      `https://v3.sg.media-imdb.com/suggestion/x/${query}.json?includeVideos=0`
    );

    let response = {
      query: query,
    };

    let titles = [];

    data.d.forEach((node) => {
      try {
        if (!node.qid) return;
        if (!["movie", "tvSeries", "tvMovie"].includes(node.qid)) return;

        let imageObj = {
          image: null,
          image_large: null,
        };

        if (node.i) {
          imageObj.image_large = node.i.imageUrl;

          try {
            let width = Math.floor((396 * node.i.width) / node.i.height);

            imageObj.image = node.i.imageUrl.replace(
              /[.]_.*_[.]/,
              `._V1_UY396_CR6,0,${width},396_AL_.`
            );
          } catch (_) {
            imageObj.image = imageObj.image_large;
          }
        }

        titles.push({
          id: node.id,
          title: node.l,
          year: node.y,
          type: node.qid,
          ...imageObj,
          api_path: `/title/${node.id}`,
          imdb: `https://www.imdb.com/title/${node.id}`,
        });
      } catch (_) {
        console.log(_);
      }
    });

    response.message = `Found ${titles.length} titles`;
    response.results = titles;

    return c.json(response);
  } catch (error) {
    return c.json({
      query: null,
      results: [],
      message: error.message,
    });
  }
});

export default searchV2;