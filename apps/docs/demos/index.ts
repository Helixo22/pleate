// Component pages: description, import path, the examples (each file in demos/<slug>/<id>.tsx) and the main props.
import type { ComponentType } from "react";
import AvatarBasic from "./avatar/basic";
import BadgeVariants from "./badge/variants";
import ButtonFullWidth from "./button/full-width";
import ButtonIconsLoading from "./button/icons-loading";
import ButtonSizes from "./button/sizes";
import ButtonTones from "./button/tones";
import ButtonVariants from "./button/variants";
import CheckboxBasic from "./checkbox/basic";
import CheckboxVariants from "./checkbox/variants";
import IconButtonVariants from "./icon-button/variants";
import InputAdornments from "./input/adornments";
import InputSizes from "./input/sizes";
import InputVariants from "./input/variants";
import LabelBasic from "./label/basic";
import RadioBasic from "./radio/basic";
import SelectBasic from "./select/basic";
import SliderBasic from "./slider/basic";
import SpinnerBasic from "./spinner/basic";
import SwitchBasic from "./switch/basic";
import TagBasic from "./tag/basic";
import TextareaAutoResize from "./textarea/auto-resize";

export type Demo = {
  id: string;
  title: string;
  description?: string;
  align?: "center" | "start" | "stretch";
  Component: ComponentType;
};
export type PropRow = { name: string; type: string; default?: string; description: string };
export type ComponentDoc = {
  name: string;
  description: string;
  importName: string;
  demos: Demo[];
  props: PropRow[];
  a11y?: string[];
};

const SIZE = (sizes: string, d = "md"): PropRow => ({ name: "size", type: sizes, default: `"${d}"`, description: "Height, padding and type size." });

export const DOCS: Record<string, ComponentDoc> = {
  button: {
    name: "Button",
    description: "The primary action. Capsule-shaped like iOS, with six looks, four tones and five sizes. Presses scale down slightly; loading keeps the width.",
    importName: "Button",
    demos: [
      { id: "variants", title: "Variants", description: "From the strongest (filled) to the quietest (plain).", Component: ButtonVariants },
      { id: "tones", title: "Tones", description: "Accent follows the palette; danger and success are fixed semantic colors.", align: "start", Component: ButtonTones },
      { id: "sizes", title: "Sizes and shapes", align: "start", Component: ButtonSizes },
      { id: "icons-loading", title: "Icons, loading, disabled", Component: ButtonIconsLoading },
      { id: "full-width", title: "Full width", description: "The bottom of a phone sheet or form.", align: "stretch", Component: ButtonFullWidth },
    ],
    props: [
      { name: "variant", type: '"filled" | "tinted" | "gray" | "surface" | "outline" | "plain"', default: '"filled"', description: "Visual weight." },
      { name: "tone", type: '"accent" | "neutral" | "danger" | "success"', default: '"accent"', description: "Color role." },
      SIZE('"xs" | "sm" | "md" | "lg" | "xl"'),
      { name: "shape", type: '"pill" | "rounded"', default: '"pill"', description: "Capsule or rounded rectangle." },
      { name: "loading", type: "boolean", default: "false", description: "Spinner in place of the content; the button is disabled and aria-busy." },
      { name: "startIcon / endIcon", type: "ReactNode", description: "Icons sized automatically." },
      { name: "fullWidth", type: "boolean", default: "false", description: "Stretch to the container." },
      { name: "asChild", type: "boolean", default: "false", description: "Style your own element (Next <Link>, <a>)." },
    ],
    a11y: ["Renders a native <button type=\"button\">.", "Focus ring on keyboard focus only.", "loading sets aria-busy and disables presses."],
  },
  "icon-button": {
    name: "Icon Button",
    description: "A round or rounded-square button that holds only an icon. aria-label is required by the types.",
    importName: "IconButton",
    demos: [{ id: "variants", title: "Variants and sizes", align: "start", Component: IconButtonVariants }],
    props: [
      { name: "aria-label", type: "string", description: "Required accessible name." },
      { name: "icon", type: "ReactNode", description: "The glyph (or pass it as children)." },
      { name: "variant / tone / size / shape", type: "—", default: '"gray"', description: "Same as Button; defaults to the gray variant." },
    ],
  },
  input: {
    name: "Input",
    description: "Text field in three looks: filled iOS well, outline, and surface for gray grouped pages. Adornments hold icons, units or buttons.",
    importName: "Input",
    demos: [
      { id: "variants", title: "Variants and states", align: "stretch", Component: InputVariants },
      { id: "adornments", title: "Adornments", align: "stretch", Component: InputAdornments },
      { id: "sizes", title: "Sizes", description: "Small stays at 16px on phones so iOS never zooms in on focus.", align: "stretch", Component: InputSizes },
    ],
    props: [
      { name: "variant", type: '"filled" | "outline" | "surface"', default: '"filled"', description: "Field look." },
      SIZE('"sm" | "md" | "lg"'),
      { name: "startAdornment / endAdornment", type: "ReactNode", description: "Content before and after the text." },
      { name: "invalid", type: "boolean", description: "Red edge and aria-invalid." },
      { name: "className / inputClassName", type: "string", description: "Field box / the <input> itself (the ref points at the input)." },
    ],
  },
  textarea: {
    name: "Textarea",
    description: "Multi-line text that grows with its content between minRows and maxRows, with an optional live character counter.",
    importName: "Textarea",
    demos: [{ id: "auto-resize", title: "Auto-resize and counter", align: "stretch", Component: TextareaAutoResize }],
    props: [
      { name: "autoResize", type: "boolean", default: "true", description: "Grow with content (CSS field-sizing, JS fallback)." },
      { name: "minRows / maxRows", type: "number", default: "3 / 12", description: "Height limits in lines." },
      { name: "showCount", type: "boolean", default: "false", description: "Counter, against maxLength when set." },
      { name: "variant / size / invalid", type: "—", description: "Same as Input." },
    ],
  },
  select: {
    name: "Select",
    description: "Pick one option from a list. The menu grows out of the trigger, with a checkmark on the selected row; full keyboard and typeahead support.",
    importName: "Select, SelectTrigger, SelectValue, SelectContent, SelectItem",
    demos: [{ id: "basic", title: "Groups, descriptions, placeholder", align: "stretch", Component: SelectBasic }],
    props: [
      { name: "Select", type: "value, defaultValue, onValueChange, disabled", description: "Radix Select root." },
      { name: "SelectTrigger", type: "variant, size, invalid, startAdornment", description: "Styled like Input." },
      { name: "SelectItem", type: "value, disabled, description", description: "One option; description shows a second line." },
    ],
  },
  checkbox: {
    name: "Checkbox",
    description: "Round like iOS or square, with a drawn-in checkmark and an indeterminate state. Pass label and description for a clickable row.",
    importName: "Checkbox",
    demos: [
      { id: "basic", title: "Indeterminate parent", align: "start", Component: CheckboxBasic },
      { id: "variants", title: "Sizes, shapes, description", align: "start", Component: CheckboxVariants },
    ],
    props: [
      { name: "checked / defaultChecked", type: 'boolean | "indeterminate"', description: "State." },
      { name: "onCheckedChange", type: '(checked: boolean | "indeterminate") => void', description: "Change handler." },
      { name: "shape", type: '"circle" | "square"', default: '"circle"', description: "iOS circle or rounded square." },
      SIZE('"sm" | "md" | "lg"'),
      { name: "label / description", type: "ReactNode", description: "Builds the labelled row (description is wired with aria-describedby)." },
      { name: "labelPlacement", type: '"end" | "start"', default: '"end"', description: "Text after the box, or before it across the row." },
    ],
  },
  radio: {
    name: "Radio",
    description: "One choice among a few. Arrow keys move between options.",
    importName: "RadioGroup, Radio",
    demos: [{ id: "basic", title: "Group", align: "start", Component: RadioBasic }],
    props: [
      { name: "RadioGroup", type: "value, defaultValue, onValueChange, orientation", description: "Radix RadioGroup root." },
      { name: "Radio", type: "value, label, description, size, disabled", description: "One option." },
    ],
  },
  switch: {
    name: "Switch",
    description: "The iOS toggle: the thumb stretches while pressed. Use for settings that apply immediately.",
    importName: "Switch",
    demos: [{ id: "basic", title: "Switches and settings rows", align: "start", Component: SwitchBasic }],
    props: [
      { name: "checked / defaultChecked / onCheckedChange", type: "boolean", description: "State." },
      { name: "tone", type: '"accent" | "success"', default: '"accent"', description: "Accent or iOS green when on." },
      SIZE('"sm" | "md"'),
      { name: "label / description / labelPlacement", type: "—", description: "As Checkbox; use \"start\" for settings rows." },
    ],
  },
  slider: {
    name: "Slider",
    description: "Pick a value or a range. Knob style, or the thick Control Center bar where the fill is the handle.",
    importName: "Slider",
    demos: [{ id: "basic", title: "Value, range and bar", align: "stretch", Component: SliderBasic }],
    props: [
      { name: "value / defaultValue", type: "number[]", description: "One number, or two for a range." },
      { name: "min / max / step", type: "number", default: "0 / 100 / 1", description: "Bounds." },
      { name: "variant", type: '"knob" | "bar"', default: '"knob"', description: "Look." },
      SIZE('"sm" | "md" | "lg"'),
      { name: "thumbLabels", type: "string[]", description: "Accessible name of each thumb." },
    ],
  },
  badge: {
    name: "Badge",
    description: "Small read-only label for statuses and counts.",
    importName: "Badge",
    demos: [{ id: "variants", title: "Variants, tones, counts", align: "start", Component: BadgeVariants }],
    props: [
      { name: "variant", type: '"solid" | "soft" | "outline"', default: '"soft"', description: "Weight." },
      { name: "tone", type: '"accent" | "neutral" | "success" | "warning" | "danger" | "info"', default: '"accent"', description: "Color role." },
      SIZE('"sm" | "md" | "lg"'),
      { name: "dot", type: "boolean", description: "Leading status dot." },
    ],
  },
  avatar: {
    name: "Avatar",
    description: "A photo with a graceful fallback: initials on a gradient whose hue is stable per name, or an icon. Groups overlap and fold into +N.",
    importName: "Avatar, AvatarGroup",
    demos: [{ id: "basic", title: "Sizes, fallbacks, status, group", align: "start", Component: AvatarBasic }],
    props: [
      { name: "src / name / alt", type: "string", description: "Photo, name for initials and color, accessible name." },
      SIZE('"xs" | "sm" | "md" | "lg" | "xl" | "2xl"'),
      { name: "shape", type: '"circle" | "rounded"', default: '"circle"', description: "Circle or squircle-like rounded square." },
      { name: "status", type: '"online" | "away" | "busy" | "offline"', description: "Presence dot." },
      { name: "color / icon", type: "string / ReactNode", description: "Custom fallback color and glyph." },
      { name: "AvatarGroup max", type: "number", description: "Visible avatars before +N." },
    ],
  },
  tag: {
    name: "Tag",
    description: "Chips for keywords and filters: static, toggleable (aria-pressed) or removable.",
    importName: "Tag",
    demos: [{ id: "basic", title: "Filters, removable, variants", align: "start", Component: TagBasic }],
    props: [
      { name: "variant", type: '"soft" | "outline" | "surface" | "accent"', default: '"soft"', description: "Look." },
      SIZE('"sm" | "md" | "lg"'),
      { name: "onClick + selected", type: "—", description: "Turns the tag into a toggle button." },
      { name: "onRemove / removeLabel", type: "—", description: "Adds a remove button." },
      { name: "icon", type: "ReactNode", description: "Leading icon." },
    ],
  },
  label: {
    name: "Label",
    description: "Form label with a required mark (announced to screen readers) and an optional hint.",
    importName: "Label",
    demos: [{ id: "basic", title: "With an input", align: "stretch", Component: LabelBasic }],
    props: [
      { name: "htmlFor", type: "string", description: "The control's id." },
      { name: "required", type: "boolean", description: "Red asterisk + \"(required)\" for screen readers." },
      { name: "hint", type: "ReactNode", description: "Trailing helper text." },
    ],
  },
  spinner: {
    name: "Spinner",
    description: "The iOS activity indicator in the current text color.",
    importName: "Spinner",
    demos: [{ id: "basic", title: "Sizes and colors", Component: SpinnerBasic }],
    props: [
      SIZE('"xs" | "sm" | "md" | "lg" | "xl" | number'),
      { name: "label", type: "string | null", default: '"Loading"', description: "Accessible name; null when a parent announces the state." },
    ],
  },
};
