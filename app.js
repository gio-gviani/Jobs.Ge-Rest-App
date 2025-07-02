import { JSDOM } from "jsdom";
import TelegramBot from "node-telegram-bot-api";
import mongoose from "mongoose";

// MongoDB connection
mongoose.connect(
  "mongodb+srv://jobsGeDB:giorgigv123@cluster0.1tdbphq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB error:"));
db.once("open", () => {
  console.log("✅ MongoDB connected");
});

// Your bot token
const token = "7804398486:AAHM9ii5w6hgN8s3xKHSq5xPdUSqsRxW0aE";
const bot = new TelegramBot(token, { polling: true });

const messageSchema = new mongoose.Schema({
  chatId: Number,
  title: String,
  link: String,
  date: { type: Date, default: Date.now },
});

const Message = mongoose.model("vacancy", messageSchema);

async function fetchVacancies(keyword, chatId) {
  const url = "https://jobs.ge/rss?cid=6" + "&q=" + keyword;

  const req = await fetch(url);
  const rss = await req.text();

  const dom = new JSDOM(rss);
  const items = dom.window.document
    .querySelector("#job_list_table")
    .querySelectorAll("tr");
  items.forEach(async (element) => {
    const links = element.querySelectorAll("a");
    if (!links) return; // Skip if no link is found
    if (links.length < 2) return; // Skip if there are not enough links
    const title = links[0].textContent;
    const link = "https://jobs.ge" + links[0].href;

    const onevac = await Message.findOne({ title: title });
    //   console.log(`Checking vacancy: ${title}`);
    if (!onevac) {
      console.log(
        `Vacancy doesnot exists --------------------------------------------------------------------`
      );
      const newVacancy = new Message({
        title: title,
        link: link,
      });
      Message.create(newVacancy);
      console.log(`New vacancy added: ${title}`);
      bot.sendMessage(chatId, `New vacancy found: ${title}\nLink: ${link}`);
    }
  });
}
// mongodb+srv://jobsGeDB:<db_password>@cluster0.1tdbphq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

//  7804398486:AAHM9ii5w6hgN8s3xKHSq5xPdUSqsRxW0aE

// Define a schema & model

const all_vacancies = [];
// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const keywords = ["react", "front-end", "სტაჟიორი", "სტაჟირება", "frontend"];

  setInterval(async () => {
    for (const keyword of keywords) {
      const items = await fetchVacancies(keyword, chatId);
    }
    bot.sendMessage(chatId, "TEST");
  }, 1000 * 60 * 1); // Check every minute
});
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Bot stopped. You can restart it with /start command."
  );
  process.exit(); // Stop the bot
});
