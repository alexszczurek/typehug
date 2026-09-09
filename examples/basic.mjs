import { glue, glueRuns } from "@typehug/pl";
import { glue as glueAny } from "@typehug/all";
import { glueHtml } from "@typehug/pl/html";

const visible = (text) => text.replaceAll("\u00a0", "⍽");

console.log("⍽ marks a nonbreaking space in these examples.\n");
console.log("Polish:", visible(glue("Idę w dobrym kierunku.")));
console.log("English:", visible(glueAny("I have a question.", { locale: "en" })));
console.log("HTML:", glueHtml('<p>Idę w <strong>dobrym kierunku</strong>.</p>'));
console.log("Runs:", glueRuns([
  { text: "Idę w ", bold: false },
  { text: "dobrym kierunku.", bold: true },
]).map((run) => ({ ...run, text: visible(run.text) })));
