import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { parseStringPromise } from "xml2js";

dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors());

app.get("/search", async (req, res) => {
  const query = req.query.q?.trim();
  if (!query) {
    return res.status(400).json({ error: "Нет запроса" });
  }

  try {
    const folderId = process.env.YANDEX_FOLDER_ID;
    const iamToken = process.env.YANDEX_IAM_TOKEN;

    // тело запроса к Search API
    const body = {
      query: {
        searchType: "WEB",
        queryText: query,
        familyMode: "NONE",
        page: 0,
        fixTypoMode: "DISABLED"
      },
      sortSpec: {
        sortMode: "RELEVANCE",
        sortOrder: "ASCENDING"
      },
      groupSpec: {
        groupMode: "FLAT",
        groupsOnPage: 10,
        docsInGroup: 1
      },
      maxPassages: 1,
      region: 213,
      l10N: "ru",
      folderId: folderId,
      responseFormat: "XML",
      userAgent: "Mozilla/5.0"
    };

    // отправляем запрос
    const { data } = await axios.post(
      "https://searchapi.api.cloud.yandex.net/v2/web/searchAsync",
      body,
      {
        headers: {
          Authorization: `Bearer ${iamToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    // получаем ID операции
    const operationId = data.id;
    if (!operationId) {
      return res.status(500).json({ error: "Не удалось получить ID операции" });
    }

    // ждём выполнения операции
    let result;
    let done = false;
    while (!done) {
      const op = await axios.get(
        `https://operation.api.cloud.yandex.net/operations/${operationId}`,
        {
          headers: { Authorization: `Bearer ${iamToken}` }
        }
      );
      done = op.data.done;
      result = op.data.response;
      if (!done) {
        await new Promise((r) => setTimeout(r, 2000)); // пауза 2 сек
      }
    }

    // декодируем Base64 → XML
    const rawData = Buffer.from(result.rawData, "base64").toString("utf-8");

    // парсим XML → JSON
    const parsed = await parseStringPromise(rawData);

    // достаём результаты
    const docs =
      parsed.yandexsearch?.response?.[0]?.results?.[0]?.grouping?.[0]?.group ||
      [];
    const results = docs.map((doc) => {
      const title = doc.doc?.[0]?.title?.[0] || "";
      const link = doc.doc?.[0]?.url?.[0] || "";
      const snippet = doc.doc?.[0]?.passages?.[0]?.passage?.[0] || "";
      return { title, link, snippet };
    });

    res.json({ query, count: results.length, results });
  } catch (err) {
    console.error("Ошибка API:", err.message);
    res.status(500).json({ error: "Ошибка при получении данных с Яндекс API" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});

