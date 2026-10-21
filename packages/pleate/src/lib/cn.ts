// cn(): joins class names and resolves Tailwind conflicts, aware of pleate's own type scale (text-headline is a font
// size, not a color) so the last size or color wins as expected.
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl", "display", "display-sm", "large-title", "title1", "title2", "title3",
            "headline", "body", "callout", "subhead", "footnote", "caption1", "caption2",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
