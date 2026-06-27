import blueTemplate from "../../pictures/Community Cases/blau.png";
import yellowTemplate from "../../pictures/Community Cases/gelb.png";
import greenTemplate from "../../pictures/Community Cases/grün.png";
import lightBlueTemplate from "../../pictures/Community Cases/hellblau.png";
import purpleTemplate from "../../pictures/Community Cases/lila.png";
import orangeTemplate from "../../pictures/Community Cases/orange.png";
import pinkTemplate from "../../pictures/Community Cases/pink.png";
import redTemplate from "../../pictures/Community Cases/rot.png";

export const communityCaseTemplates = [
  { id: "blue", label: "Blau", image: blueTemplate },
  { id: "yellow", label: "Gelb", image: yellowTemplate },
  { id: "green", label: "Grün", image: greenTemplate },
  { id: "light-blue", label: "Hellblau", image: lightBlueTemplate },
  { id: "purple", label: "Lila", image: purpleTemplate },
  { id: "orange", label: "Orange", image: orangeTemplate },
  { id: "pink", label: "Pink", image: pinkTemplate },
  { id: "red", label: "Rot", image: redTemplate },
];

const templateById = new Map(
  communityCaseTemplates.map((template) => [template.id, template])
);

export function getCommunityCaseTemplate(templateId) {
  return templateById.get(templateId) ?? communityCaseTemplates[0];
}
