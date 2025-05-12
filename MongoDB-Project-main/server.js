const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const ObjectModel = require("./models/Object");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/cardsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Verbonden met MongoDB"))
  .catch(err => console.error("❌ MongoDB fout:", err));

const loadDataIfNeeded = async () => {
    const count = await ObjectModel.countDocuments();
    if (count === 0) {
        const rawData = fs.readFileSync("./data/data.json", "utf-8");
        const jsonData = JSON.parse(rawData);
        await ObjectModel.insertMany(jsonData);
        console.log("📥 Data toegevoegd aan MongoDB");
    }
};
loadDataIfNeeded();

app.get("/", async (req, res) => {
    const data = await ObjectModel.find();
    let html = fs.readFileSync("./views/index.html", "utf-8");
    let rows = data.map(obj => `
        <tr>
            <td><img src="${obj.image}" alt="${obj.name}" width="50"></td>
            <td>${obj.name}</td>
            <td>${obj.birthdate}</td>
            <td>${obj.rarity}</td>
            <td>${obj.active ? "✅" : "❌"}</td>
            <td>
                <a href="/detail/${obj.id}">Bekijk</a> |
                <a href="/edit/${obj.id}">Bewerk</a>
            </td>
        </tr>
    `).join("");
    html = html.replace("{{dataRows}}", rows);
    res.send(html);
});

app.get("/detail/:id", async (req, res) => {
    const obj = await ObjectModel.findOne({ id: req.params.id });
    if (!obj) return res.status(404).send("Object niet gevonden");

    let html = fs.readFileSync("./views/detail.html", "utf-8");
    html = html.replace("{{name}}", obj.name)
               .replace("{{image}}", obj.image)
               .replace("{{description}}", obj.description)
               .replace("{{birthdate}}", obj.birthdate)
               .replace("{{rarity}}", obj.rarity)
               .replace("{{active}}", obj.active ? "✅ Actief" : "❌ Niet Actief")
               .replace("{{abilities}}", obj.abilities.join(", "));

    res.send(html);
});

app.get("/edit/:id", async (req, res) => {
    const obj = await ObjectModel.findOne({ id: req.params.id });
    if (!obj) return res.status(404).send("Object niet gevonden");

    let html = fs.readFileSync("./views/edit.html", "utf-8");
    html = html.replace(/{{id}}/g, obj.id)
               .replace(/{{name}}/g, obj.name)
               .replace(/{{image}}/g, obj.image)
               .replace(/{{rarityCommon}}/, obj.rarity === "Common" ? "selected" : "")
               .replace(/{{rarityRare}}/, obj.rarity === "Rare" ? "selected" : "")
               .replace(/{{rarityEpic}}/, obj.rarity === "Epic" ? "selected" : "")
               .replace(/{{activeYes}}/, obj.active ? "selected" : "")
               .replace(/{{activeNo}}/, !obj.active ? "selected" : "");

    res.send(html);
});

app.post("/edit/:id", async (req, res) => {
    const { name, image, rarity, active } = req.body;
    await ObjectModel.findOneAndUpdate(
        { id: req.params.id },
        {
            name,
            image,
            rarity,
            active: active === "true"
        }
    );
    res.redirect("/");
});

app.listen(PORT, () => {
    console.log(`🚀 Server draait op http://localhost:${PORT}`);
});