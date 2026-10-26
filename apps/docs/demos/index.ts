// Component pages: description, import path, the examples (each file in demos/<slug>/<id>.tsx) and the main props.
import type { ComponentType } from "react";
import ApiKeyListBasic from "./api-key-list/basic";
import AuthCardBasic from "./auth-card/basic";
import ContactBasic from "./contact/basic";
import DataTableBasic from "./data-table/basic";
import FileUploadUploads from "./file-upload/uploads";
import ForgotPasswordFormBasic from "./forgot-password-form/basic";
import LoginFormBasic from "./login-form/basic";
import NotificationCenterBasic from "./notification-center/basic";
import OAuthButtonsBasic from "./oauth-buttons/basic";
import OtpInputBasic from "./otp-input/basic";
import PaginationRange from "./pagination/range";
import PasswordInputBasic from "./password-input/basic";
import ResetPasswordFormBasic from "./reset-password-form/basic";
import SessionListBasic from "./session-list/basic";
import SignupFormBasic from "./signup-form/basic";
import TwoFactorFormBasic from "./two-factor-form/basic";
import TwoFactorSetupBasic from "./two-factor-setup/basic";
import CtaBasic from "./cta/basic";
import FeatureGridVariants from "./feature-grid/variants";
import HeroVariants from "./hero/variants";
import LogoMarqueeBasic from "./logo-marquee/basic";
import PricingBasic from "./pricing/basic";
import TestimonialLayouts from "./testimonial/layouts";
import AnimatedTextHeadline from "./animated-text/headline";
import AnimatedTextNumbers from "./animated-text/numbers";
import AnimatedTextScroll from "./animated-text/scroll";
import HoverEffectsBasic from "./hover-effects/basic";
import PageTransitionBasic from "./page-transition/basic";
import RevealBasic from "./reveal/basic";
import RevealProgress from "./reveal/progress";
import BotFaceStates from "./bot-face/states";
import BotFaceVariants from "./bot-face/variants";
import BotFaceVoice from "./bot-face/voice";
import ChatFull from "./chat/full";
import ComposerBasic from "./composer/basic";
import ModelPickerBasic from "./model-picker/basic";
import PromptSuggestionsBasic from "./prompt-suggestions/basic";
import ReasoningBasic from "./reasoning/basic";
import ResultCardBasic from "./result-card/basic";
import StreamingTextBasic from "./streaming-text/basic";
import DatePickerBasic from "./date-picker/basic";
import FileUploadBasic from "./file-upload/basic";
import FormFieldBooking from "./form-field/booking";
import SearchBarBasic from "./search-bar/basic";
import AccordionVariants from "./accordion/variants";
import EmptyStateBasic from "./empty-state/basic";
import ListSettings from "./list/settings";
import ProgressBasic from "./progress/basic";
import SkeletonBasic from "./skeleton/basic";
import StatCardBasic from "./stat-card/basic";
import TableBasic from "./table/basic";
import TimelineBasic from "./timeline/basic";
import ActionSheetBasic from "./action-sheet/basic";
import AlertBasic from "./alert/basic";
import AlertDialogBasic from "./alert-dialog/basic";
import BottomSheetBasic from "./bottom-sheet/basic";
import ModalBasic from "./modal/basic";
import PopoverBasic from "./popover/basic";
import ToastBasic from "./toast/basic";
import TooltipBasic from "./tooltip/basic";
import BreadcrumbBasic from "./breadcrumb/basic";
import DropdownBasic from "./dropdown/basic";
import MenuBasic from "./menu/basic";
import MenuContext from "./menu/context";
import PaginationVariants from "./pagination/variants";
import SegmentedControlBasic from "./segmented-control/basic";
import TabsVariants from "./tabs/variants";
import CardComposed from "./card/composed";
import CardVariants from "./card/variants";
import ContainerSizes from "./container/sizes";
import DividerBasic from "./divider/basic";
import FooterBasic from "./footer/basic";
import GridBasic from "./grid/basic";
import NavbarBasic from "./navbar/basic";
import NavigationBarLargeTitle from "./navigation-bar/large-title";
import SectionTones from "./section/tones";
import SidebarBasic from "./sidebar/basic";
import StackBasic from "./stack/basic";
import TabBarVariants from "./tab-bar/variants";
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
  /** Module path when it isn't pleate/<slug> (e.g. "pleate/ai/chat"). */
  importPath?: string;
  demos: Demo[];
  props: PropRow[];
  a11y?: string[];
};

const SIZE = (sizes: string, d = "md"): PropRow => ({ name: "size", type: sizes, default: `"${d}"`, description: "Height, padding and type size." });

export const DOCS: Record<string, ComponentDoc> = {

  hero: {
    name: "Hero",
    description: "The opening of a page: announcement pill, display title, description, actions, footnote and a visual. Centered or split, on the page, a soft wash or a dark band.",
    importName: "Hero",
    importPath: "pleate/marketing/hero",
    demos: [{ id: "variants", title: "Centered wash and dark split", align: "stretch", Component: HeroVariants }],
    props: [
      { name: "title / description / eyebrow / footnote", type: "ReactNode", description: "Copy (title takes RotatingText, GradientText…)." },
      { name: "actions / media", type: "ReactNode", description: "Buttons and the visual." },
      { name: "layout", type: '"center" | "split"', default: '"center"', description: "Arrangement." },
      { name: "background", type: '"plain" | "wash" | "dark"', default: '"plain"', description: "Backdrop; dark pins its own theme." },
      { name: "size", type: '"md" | "lg"', default: '"lg"', description: "Type scale and padding." },
    ],
  },
  "feature-grid": {
    name: "Feature Grid",
    description: "What the product does: cards, plain columns, or a bento layout with spans and visuals. Items enter one after another.",
    importName: "FeatureGrid",
    importPath: "pleate/marketing/feature-grid",
    demos: [{ id: "variants", title: "Cards, bento, plain", align: "stretch", Component: FeatureGridVariants }],
    props: [
      { name: "features", type: "{ icon, title, description, href?, linkLabel?, media?, span?, rowSpan? }[]", description: "Items; href makes the whole card a link." },
      { name: "columns", type: "2 | 3 | 4", default: "3", description: "Columns on large screens." },
      { name: "variant", type: '"cards" | "plain" | "bento"', default: '"cards"', description: "Look." },
    ],
  },
  pricing: {
    name: "Pricing",
    description: "Plans with a monthly/yearly switch: prices roll to the new amount and the saving is shown. Highlight a plan; mark what's included.",
    importName: "Pricing",
    importPath: "pleate/marketing/pricing",
    demos: [{ id: "basic", title: "Three plans", align: "stretch", Component: PricingBasic }],
    props: [
      { name: "plans", type: "{ id, name, description, price: { monthly, yearly } | null, features, cta, highlighted?, badge? }[]", description: "Plans (yearly = monthly equivalent)." },
      { name: "currency / locale", type: "string", default: '"EUR"', description: "Intl formatting." },
      { name: "billing / defaultBilling / onBillingChange", type: '"monthly" | "yearly"', default: '"yearly"', description: "Period." },
      { name: "labels", type: "object", description: "Translatable texts." },
    ],
    a11y: ["Excluded features are announced as not included.", "The period switch is a radio group."],
  },
  testimonial: {
    name: "Testimonial",
    description: "Quotes with people behind them: a big featured quote, balanced columns, or a swipeable carousel with snap.",
    importName: "Testimonials, TestimonialCard",
    importPath: "pleate/marketing/testimonial",
    demos: [{ id: "layouts", title: "Featured, grid, carousel", align: "stretch", Component: TestimonialLayouts }],
    props: [
      { name: "items", type: "{ quote, name, role?, avatar?, rating? }[]", description: "Testimonials." },
      { name: "layout", type: '"grid" | "carousel" | "featured"', default: '"grid"', description: "Arrangement." },
    ],
  },
  cta: {
    name: "CTA",
    description: "The closing call to action (accent, surface or dark, with an optional visual) and a newsletter signup.",
    importName: "CTA, Newsletter",
    importPath: "pleate/marketing/cta",
    demos: [{ id: "basic", title: "Accent, dark with media, newsletter", align: "stretch", Component: CtaBasic }],
    props: [
      { name: "CTA title / description / actions / media", type: "ReactNode", description: "Content." },
      { name: "tone", type: '"accent" | "surface" | "dark"', default: '"accent"', description: "Band color." },
      { name: "align", type: '"center" | "start"', default: '"center"', description: "Text alignment." },
      { name: "Newsletter onSubscribe", type: "(email) => void | Promise", description: "Loading while the promise runs, then the success message." },
    ],
  },
  "logo-marquee": {
    name: "Logo Marquee",
    description: "An endless row of logos or names drifting sideways with faded edges. Pauses on hover; static and wrapped with reduced motion.",
    importName: "LogoMarquee",
    importPath: "pleate/marketing/logo-marquee",
    demos: [{ id: "basic", title: "Names and chips", align: "stretch", Component: LogoMarqueeBasic }],
    props: [
      { name: "duration / reverse", type: "number / boolean", default: "30 / false", description: "Seconds per loop and direction." },
      { name: "gap / fade", type: "CSS length / boolean", default: '"3rem" / true', description: "Spacing and edge fade." },
      { name: "label", type: "string", description: "Names the region for screen readers." },
    ],
  },

  "animated-text": {
    name: "Animated Text",
    description: "Text that moves with intent: blur-in, rotating words, palette gradients, shine, decrypting, counting numbers and words that light up as you scroll. Readers always get the plain text.",
    importName: "BlurText, RotatingText, GradientText, ShinyText, DecryptedText, CountUp, ScrollRevealText",
    importPath: "pleate/effects/animated-text",
    demos: [
      { id: "headline", title: "Headlines", align: "stretch", Component: AnimatedTextHeadline },
      { id: "numbers", title: "Numbers and codes", align: "stretch", Component: AnimatedTextNumbers },
      { id: "scroll", title: "Scroll-lit statement", description: "Scroll the page: words light up as they pass.", Component: AnimatedTextScroll },
    ],
    props: [
      { name: "BlurText", type: 'text, by: "word" | "letter", as, stagger, delay, distance, once', description: "Rise out of blur on view." },
      { name: "RotatingText", type: "words, interval, pillClassName", description: "Rolling word, resizing smoothly." },
      { name: "GradientText / ShinyText", type: "colors, speed / base, shine, speed", description: "Animated fills (palette by default)." },
      { name: "DecryptedText", type: 'text, trigger: "view" | "hover", speed, characters', description: "Scramble then resolve." },
      { name: "CountUp", type: "to, from, duration, format (Intl), locale", description: "Counts on view." },
      { name: "ScrollRevealText", type: "text, as", description: "Words light up with scroll." },
    ],
    a11y: ["Split text is aria-hidden with the full sentence in a visually hidden copy.", "Reduced motion shows the final state immediately."],
  },
  reveal: {
    name: "Reveal",
    description: "Content that enters as it scrolls into view, alone or in sequence, plus a reading progress bar and parallax.",
    importName: "Reveal, RevealGroup, RevealItem, ScrollProgress, Parallax",
    importPath: "pleate/effects/reveal",
    demos: [
      { id: "basic", title: "Effects and staggered groups", description: "Reload or scroll back to replay (once={false} replays every time).", align: "stretch", Component: RevealBasic },
      { id: "progress", title: "Progress bar and parallax", align: "stretch", Component: RevealProgress },
    ],
    props: [
      { name: "effect", type: '"fade" | "up" | "down" | "left" | "right" | "zoom" | "blur"', default: '"up"', description: "Entrance." },
      { name: "distance / delay / duration", type: "number", description: "Motion amounts." },
      { name: "once / amount", type: "boolean / 0–1", default: "true / 0.25", description: "Replay and visibility threshold." },
      { name: "RevealGroup stagger", type: "number", default: "0.08", description: "Seconds between RevealItems." },
      { name: "ScrollProgress target / position / fixed", type: "ref / top | bottom / boolean", description: "Page or element progress." },
      { name: "Parallax speed", type: "-1…1", default: "0.2", description: "Drift relative to scroll." },
    ],
  },
  "page-transition": {
    name: "Page Transition",
    description: "Animated page entrances for the App Router, used in app/template.tsx. \"slide\" mimics an iOS push and reverses on Back. This docs site uses it.",
    importName: "PageTransition, useNavigationDirection",
    importPath: "pleate/effects/page-transition",
    demos: [{ id: "basic", title: "Variants", description: "Switch pages between the docs to see fade-up in action.", Component: PageTransitionBasic }],
    props: [
      { name: "variant", type: '"fade" | "fade-up" | "slide"', default: '"fade-up"', description: "Entrance." },
      { name: "useNavigationDirection()", type: '→ "forward" | "back"', description: "How the current page was reached." },
    ],
    a11y: ["Scrolls to the top on forward navigation; Back keeps the browser's restored position.", "No animation with reduced motion."],
  },
  "hover-effects": {
    name: "Hover Effects",
    description: "Pointer effects for desktop: magnetic buttons, a spotlight that follows the cursor, 3D tilt with glare, and click sparks. Touch and reduced motion get the plain content.",
    importName: "Magnet, Spotlight, Tilt, ClickSpark",
    importPath: "pleate/effects/hover",
    demos: [{ id: "basic", title: "All four", align: "stretch", Component: HoverEffectsBasic }],
    props: [
      { name: "Magnet", type: "padding, strength", default: "60 / 0.3", description: "Pull toward the cursor." },
      { name: "Spotlight", type: "size, color", default: "320 / soft accent", description: "Light following the cursor." },
      { name: "Tilt", type: "max, glare, scale", default: "10 / true / 1.02", description: "3D tilt." },
      { name: "ClickSpark", type: "color, count, radius", default: "accent / 8 / 22", description: "Sparks on click." },
    ],
  },

  "bot-face": {
    name: "Bot Face",
    description: "An expressive assistant avatar: idle, listening, thinking, speaking and more. Eyes live on an imaginary sphere, the body squashes and stretches, and it can follow your voice.",
    importName: "BotFace, useAudioLevel",
    importPath: "pleate/ai/bot-face",
    demos: [
      { id: "states", title: "States", description: "Idle follows your pointer.", Component: BotFaceStates },
      { id: "voice", title: "Driven by your voice", description: "useAudioLevel turns a microphone stream into a level the face reacts to.", Component: BotFaceVoice },
      { id: "variants", title: "Sizes, shapes, colors", description: "Defaults to the palette accent. Switch palette to see it follow.", Component: BotFaceVariants },
    ],
    props: [
      { name: "state", type: '"idle" | "listening" | "thinking" | "speaking" | "waiting" | "happy" | "error" | "offline"', default: '"idle"', description: "Expression." },
      { name: "size", type: "number", default: "64", description: "Pixels." },
      { name: "level", type: "number | MotionValue<number>", description: "0–1 loudness for listening/speaking." },
      { name: "track", type: "boolean", description: "Follow the pointer while idle." },
      { name: "seed / color / eyeColor", type: "string", description: "Body shape; colors (accent and on-accent by default)." },
      { name: "dot / decorative / labels / animated", type: "", description: "Status dot, hide from AT, state labels, still mode." },
    ],
    a11y: ["role=img with a label per state (customizable).", "With reduced motion every state is a still pose."],
  },
  chat: {
    name: "Chat",
    description: "A complete AI chat: thread that follows the stream, bubbles or document-style answers, reasoning, sources and message actions, composed from the AI components.",
    importName: "ChatThread, Message, MessageAction",
    importPath: "pleate/ai/chat",
    demos: [{ id: "full", title: "Trip assistant", description: "Pick a suggestion or type. Try Stop while it streams, and scroll up during a reply.", align: "stretch", Component: ChatFull }],
    props: [
      { name: "ChatThread", type: "threshold, latestLabel, contentClassName", description: "Auto-scroll while at the bottom; a jump button otherwise. role=log." },
      { name: "Message role / variant", type: '"user" | "assistant" | "system" / "bubble" | "document"', description: "Who and how." },
      { name: "avatar / name / time / status", type: "", description: "Header and delivery state." },
      { name: "actions / footer / continued", type: "ReactNode / ReactNode / boolean", description: "Hover actions, attachments or sources, grouping." },
    ],
    a11y: ["New messages are announced politely (role=log).", "Actions stay reachable by keyboard (shown on focus)."],
  },
  composer: {
    name: "Composer",
    description: "The prompt box: grows with text, attachments by button, drag & drop or paste, a toolbar slot, voice, and Send that becomes Stop.",
    importName: "Composer",
    importPath: "pleate/ai/composer",
    demos: [{ id: "basic", title: "Full and minimal", description: "Paste an image, or drop files on it.", align: "stretch", Component: ComposerBasic }],
    props: [
      { name: "onSubmit", type: "({ text, files }) => void", description: "Enter or the send button; clears after." },
      { name: "generating / onStop", type: "boolean / () => void", description: "Stop mode." },
      { name: "accept / maxFiles", type: "string / number", default: "none / 8", description: "Enables attachments." },
      { name: "onVoice / listening", type: "() => void / boolean", description: "Mic button." },
      { name: "toolbar", type: "ReactNode", description: "Model picker, tools." },
      { name: "value / onValueChange / labels", type: "", description: "Controlled text and translatable labels." },
    ],
    a11y: ["Enter sends, Shift+Enter breaks the line; IME composition is respected."],
  },
  "streaming-text": {
    name: "Streaming Text",
    description: "Text that arrives in pieces: each new chunk fades in and a caret blinks while streaming. Plus the typing indicator.",
    importName: "StreamingText, TypingIndicator",
    importPath: "pleate/ai/streaming-text",
    demos: [{ id: "basic", title: "Simulated stream", align: "stretch", Component: StreamingTextBasic }],
    props: [
      { name: "text", type: "string", description: "The whole text so far." },
      { name: "streaming", type: "boolean", description: "Caret and aria-busy." },
      { name: "animate", type: "boolean", default: "true", description: "Fade new chunks." },
    ],
  },
  "prompt-suggestions": {
    name: "Prompt Suggestions",
    description: "Starter prompts for an empty chat: cards with icons, or chips that scroll on phones.",
    importName: "PromptSuggestions",
    importPath: "pleate/ai/prompt-suggestions",
    demos: [{ id: "basic", title: "Grid and chips", align: "stretch", Component: PromptSuggestionsBasic }],
    props: [
      { name: "suggestions", type: "{ title, description?, icon?, prompt }[]", description: "Items." },
      { name: "onSelect", type: "(prompt, suggestion) => void", description: "Choice." },
      { name: "variant", type: '"grid" | "chips"', default: '"grid"', description: "Look." },
    ],
  },
  "result-card": {
    name: "Result Card",
    description: "Results and sources: rich cards, numbered citation chips inside answers, and a row of compact sources.",
    importName: "ResultCard, SourceChip, SourceList",
    importPath: "pleate/ai/result-card",
    demos: [{ id: "basic", title: "Cards, citations, sources", align: "stretch", Component: ResultCardBasic }],
    props: [
      { name: "ResultCard", type: "title, href, site, favicon, snippet, image, meta, tags, actions, index, layout", description: "Whole card is the link." },
      { name: "SourceChip", type: "index, href, site, title", description: "Inline citation." },
      { name: "SourceList", type: "sources[]", description: "Horizontal list." },
    ],
  },
  "model-picker": {
    name: "Model Picker",
    description: "Choose the model: a quiet trigger, and a menu with icons, descriptions, badges and groups.",
    importName: "ModelPicker",
    importPath: "pleate/ai/model-picker",
    demos: [{ id: "basic", title: "Grouped, and field style", Component: ModelPickerBasic }],
    props: [
      { name: "models", type: "{ id, name, description?, icon?, badges?, group?, disabled? }[]", description: "Options." },
      { name: "value / onValueChange", type: "string", description: "Selection." },
      { name: "variant", type: '"ghost" | "field"', default: '"ghost"', description: "Trigger look." },
      { name: "align / side", type: "string", description: "Placement." },
    ],
  },
  reasoning: {
    name: "Reasoning",
    description: "Show the work: a thinking panel with a live timer that folds into \"Thought for 12s\", step lists for tool calls, and shimmering status text.",
    importName: "Reasoning, ReasoningSteps, ShimmerText",
    importPath: "pleate/ai/reasoning",
    demos: [{ id: "basic", title: "Steps and shimmer", align: "stretch", Component: ReasoningBasic }],
    props: [
      { name: "Reasoning active", type: "boolean", description: "Open with a timer while true; collapses when done." },
      { name: "duration / activeLabel / doneLabel", type: "number / ReactNode / (s) => ReactNode", description: "Labels." },
      { name: "ReasoningSteps steps", type: '{ label, detail?, status: "pending" | "active" | "done" | "error" }[]', description: "Progress list." },
      { name: "ShimmerText", type: "active", description: "Animated label." },
    ],
  },

  "form-field": {
    name: "Form Field",
    description: "Accessible validation without a form library. Rules run on blur, live once an error shows, and for every field on submit. Then focus jumps to the first problem.",
    importName: "Form, FormField, useForm, useFormField",
    demos: [{ id: "booking", title: "Booking request", description: "Submit it empty to see every message; values are read from the form itself.", align: "stretch", Component: FormFieldBooking }],
    props: [
      { name: "Form onSubmit", type: "(values, event) => void | Promise", description: "Runs only when valid; useForm().submitting is true while it awaits." },
      { name: "Form onInvalid", type: "(errors) => void", description: "Called when a submit is blocked." },
      { name: "FormField name / label / description / hint", type: "string / ReactNode", description: "name must match the control." },
      { name: "required / minLength / maxLength / min / max / pattern / type", type: "value | { value, message }", description: "Built-in rules, with your own messages." },
      { name: "validate", type: "(value, values) => string | undefined | Promise", description: "Custom (and cross-field, async) checks." },
      { name: "error", type: "string", description: "Controlled message (e.g. from the server)." },
    ],
    a11y: ["Label, description and error are linked with for/aria-describedby; aria-invalid on errors.", "Errors are announced (polite live region); focus moves to the first invalid field on submit."],
  },
  "date-picker": {
    name: "Date Picker",
    description: "A field that opens a calendar: popover on desktop, bottom sheet on phones. Single dates or ranges, presets, limits, localized names.",
    importName: "DatePicker, Calendar",
    demos: [{ id: "basic", title: "Single, range with presets, standalone calendar", align: "stretch", Component: DatePickerBasic }],
    props: [
      { name: "mode", type: '"single" | "range"', default: '"single"', description: "One day or from–to." },
      { name: "value / defaultValue / onValueChange", type: "Date | null  ·  { from, to }", description: "Selection." },
      { name: "min / max / isDisabled", type: "Date / Date / (date) => boolean", description: "Limits." },
      { name: "presets", type: "{ label, value: () => V }[]", description: "Quick picks." },
      { name: "locale / weekStartsOn / formatOptions", type: "string / 0–6 / Intl options", description: "Localization." },
      { name: "name", type: "string", description: "Hidden ISO value for forms (yyyy-mm-dd or yyyy-mm-dd/yyyy-mm-dd)." },
    ],
    a11y: ["The calendar is a grid: arrows, Page Up/Down (Shift for years), Home/End, Enter.", "Every day has its full date as label; today is aria-current=\"date\"."],
  },
  "search-bar": {
    name: "Search Bar",
    description: "The iOS search field: clear button, a Cancel that slides in while focused, debounced input, loading state and a focus shortcut.",
    importName: "SearchBar",
    demos: [{ id: "basic", title: "Filter, shortcut, loading", description: "Press / to focus the first one.", align: "stretch", Component: SearchBarBasic }],
    props: [
      { name: "value / defaultValue / onValueChange", type: "string", description: "Text." },
      { name: "debounce", type: "number", default: "0", description: "ms before onValueChange while typing." },
      { name: "onSearch", type: "(value) => void", description: "Enter." },
      { name: "cancelable / loading", type: "boolean", description: "iOS Cancel button; spinner instead of clear." },
      { name: "shortcut", type: '"/" | "mod+k"', description: "Global focus shortcut with a hint." },
      { name: "size / variant", type: '"sm" | "md" / "filled" | "surface"', description: "Look." },
    ],
    a11y: ["A search landmark around a type=search input.", "Escape clears; Enter searches."],
  },
  "file-upload": {
    name: "File Upload",
    description: "Drop files, click, or use the keyboard. Type, size and count checks, image previews, per-file progress and removal.",
    importName: "FileUpload",
    demos: [
      { id: "basic", title: "Dropzone with progress, compact button", align: "stretch", Component: FileUploadBasic },
      { id: "uploads", title: "Upload states", description: "Done, uploading and failed with Retry. Add files: every third one fails once.", align: "stretch", Component: FileUploadUploads },
    ],
    props: [
      { name: "value / defaultValue / onValueChange", type: "File[]", description: "Selected files." },
      { name: "accept / maxSize / maxFiles / multiple", type: "string / bytes / number / boolean", description: "Checks; rejections are listed and sent to onReject." },
      { name: "progress", type: "Record<fileName, 0–100>", description: "Upload bars (simple form; see uploads)." },
      { name: "uploads", type: 'Record<fileKey(file) | fileName, { status: "uploading" | "done" | "error", progress?: 0–1, error? }>', description: "Per file state. Key entries with fileKey(file) (name-size-lastModified), or the file name when names are unique." },
      { name: "onRetry / onRemove / retryLabel", type: "(file) => void / (file) => void / string", default: 'none / none / "Retry"', description: "Retry button on failed files; removal callback (e.g. cancel the upload)." },
      { name: "variant", type: '"dropzone" | "button"', default: '"dropzone"', description: "Look." },
      { name: "name", type: "string", description: "Include the files in the form submission." },
    ],
    a11y: ["The zone is a button: Enter/Space opens the picker.", "Rejections are announced (role=alert); every file has a named remove button."],
  },

  skeleton: {
    name: "Skeleton",
    description: "Shimmering placeholders that keep the layout steady while content loads.",
    importName: "Skeleton, SkeletonText",
    demos: [{ id: "basic", title: "Card placeholder", Component: SkeletonBasic }],
    props: [
      { name: "shape", type: '"rect" | "circle" | "text"', default: '"rect"', description: "Form." },
      { name: "width / height", type: "CSS length", description: "Size (text follows the font size)." },
      { name: "SkeletonText lines / lastLineWidth", type: "number / string", default: '3 / "60%"', description: "Paragraph placeholder." },
    ],
    a11y: ["Skeletons are aria-hidden; put aria-busy and a visually hidden label on the loading region."],
  },
  progress: {
    name: "Progress",
    description: "How far a task has got: a bar or a ring, determinate or indeterminate.",
    importName: "Progress, ProgressCircle",
    demos: [{ id: "basic", title: "Bars and rings", align: "stretch", Component: ProgressBasic }],
    props: [
      { name: "value / max", type: "number | null / number", default: "none / 100", description: "null = indeterminate." },
      { name: "tone", type: '"accent" | "success" | "warning" | "danger" | "neutral"', default: '"accent"', description: "Fill color." },
      { name: "Progress size / label / valueLabel", type: '"sm" | "md" | "lg" / ReactNode / ReactNode | true', description: "Bar height, caption, value text." },
      { name: "ProgressCircle size / thickness / children", type: "number / number / ReactNode", default: "48 / 4", description: "Ring geometry and center content." },
    ],
  },
  "empty-state": {
    name: "Empty State",
    description: "What to show when there's nothing yet: an icon, a title, one helpful sentence and the action that fixes it.",
    importName: "EmptyState",
    demos: [{ id: "basic", title: "First run and no results", align: "stretch", Component: EmptyStateBasic }],
    props: [
      { name: "icon / illustration", type: "ReactNode", description: "Tile icon, or a larger visual." },
      { name: "title / description / actions", type: "ReactNode", description: "Content." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Scale." },
      { name: "bordered", type: "boolean", description: "Dashed outline." },
    ],
  },
  table: {
    name: "Table",
    description: "Rows and columns on a rounded surface: sortable headers, density, stripes, sticky header, and cards on phones.",
    importName: "Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter",
    demos: [{ id: "basic", title: "Sortable, stacks on phones", align: "stretch", Component: TableBasic }],
    props: [
      { name: "density", type: '"comfortable" | "compact"', default: '"comfortable"', description: "Row height." },
      { name: "striped / hoverable / stickyHeader", type: "boolean", default: "false / true / false", description: "Row styling." },
      { name: "stackOnMobile", type: "boolean", description: "Rows become cards below md; set TableCell label." },
      { name: "TableHead sort / onSort / align", type: '"asc" | "desc" | false / () => void / "start" | "center" | "end"', description: "Sortable column." },
    ],
    a11y: ["Sortable headers are buttons inside th with aria-sort.", "Stacked rows keep the real table semantics; headers stay for screen readers."],
  },
  list: {
    name: "List",
    description: "The iOS Settings list: grouped sections, icon tiles, values, controls, checkmarks, chevrons and swipe actions.",
    importName: "List, ListSection, ListItem",
    demos: [{ id: "settings", title: "Settings screen", description: "Try the switch, the language rows and swiping a trip.", Component: ListSettings }],
    props: [
      { name: "ListSection header / footer / variant", type: 'ReactNode / ReactNode / "inset" | "plain"', default: '"inset"', description: "Group." },
      { name: "ListItem title / subtitle / value", type: "ReactNode", description: "Text content." },
      { name: "icon / iconColor / leading", type: "ReactNode / CSS color / ReactNode", description: "Tile glyph and color, or custom leading content." },
      { name: "trailing / selected / chevron", type: "ReactNode / boolean / boolean", description: "End accessories." },
      { name: "href / onClick / asChild", type: "", description: "Makes the row interactive." },
      { name: "swipeActions", type: "{ label, icon?, tone?, onSelect }[]", description: "Revealed by swiping left or by keyboard focus." },
    ],
    a11y: ["Rows are links or buttons only when interactive.", "Swipe actions are real buttons: Tab reaches them and reveals the row."],
  },
  accordion: {
    name: "Accordion",
    description: "Sections that expand in place: grouped like an iOS list, as separate cards, or with hairlines only.",
    importName: "Accordion, AccordionItem, AccordionTrigger, AccordionContent",
    demos: [{ id: "variants", title: "Inset, separated, plain", align: "stretch", Component: AccordionVariants }],
    props: [
      { name: "type", type: '"single" | "multiple"', description: "One or many open (Radix)." },
      { name: "collapsible / defaultValue / value", type: "", description: "State (Radix)." },
      { name: "variant", type: '"inset" | "separated" | "plain"', default: '"inset"', description: "Look." },
      { name: "AccordionTrigger icon / subtitle", type: "ReactNode", description: "Leading icon and second line." },
    ],
    a11y: ["Headers are buttons with aria-expanded inside headings.", "Arrow keys move between headers."],
  },
  timeline: {
    name: "Timeline",
    description: "Events in order along a line, with done, current and upcoming states.",
    importName: "Timeline, TimelineItem",
    demos: [{ id: "basic", title: "Booking status and day plan", align: "stretch", Component: TimelineBasic }],
    props: [
      { name: "title / time / description", type: "ReactNode", description: "Content." },
      { name: "status", type: '"done" | "current" | "upcoming"', default: '"done"', description: "Marker and line style; current gets aria-current." },
      { name: "tone / icon", type: '"accent" | "success" | "warning" | "danger" / ReactNode', description: "Marker color and glyph." },
    ],
  },
  "stat-card": {
    name: "Stat Card",
    description: "One number that matters: it counts up into view, shows the change with a colored trend and a sparkline.",
    importName: "StatCard",
    demos: [{ id: "basic", title: "Dashboard row", align: "stretch", Component: StatCardBasic }],
    props: [
      { name: "label / value / format", type: "ReactNode / number / (v) => string", description: "The metric." },
      { name: "delta / deltaLabel / invertTrend", type: "number / ReactNode / boolean", description: "Change (0.12 = +12%); invert when down is good." },
      { name: "trend", type: "number[]", description: "Sparkline data." },
      { name: "icon / animated", type: "ReactNode / boolean", default: "none / true", description: "Tile icon; count-up animation." },
    ],
    a11y: ["Screen readers read the final value, not the animation.", "No count-up with reduced motion."],
  },

  modal: {
    name: "Modal",
    description: "A dialog over the page. Centered on desktop; on phones a sheet that slides up from the bottom, or centered if you prefer.",
    importName: "Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter, ModalClose",
    demos: [{ id: "basic", title: "Form and long content", description: "Resize to a phone width to see the sheet.", Component: ModalBasic }],
    props: [
      { name: "Modal", type: "open, defaultOpen, onOpenChange", description: "Radix Dialog root." },
      { name: "ModalContent size", type: '"sm" | "md" | "lg" | "xl" | "full"', default: '"md"', description: "Desktop width." },
      { name: "ModalContent mobile", type: '"sheet" | "center"', default: '"sheet"', description: "Phone presentation." },
      { name: "showClose / closeLabel", type: "boolean / string", default: "true", description: "Corner close button." },
    ],
    a11y: ["Focus is trapped inside and returns to the trigger.", "Escape and backdrop click close it; the page behind can't scroll.", "Labelled by ModalTitle, described by ModalDescription."],
  },
  "bottom-sheet": {
    name: "Bottom Sheet",
    description: "The iOS sheet: drag between snap points, flick down to close. The footer stays on the visible edge at every height.",
    importName: "BottomSheet",
    demos: [{ id: "basic", title: "Snap points and simple sheet", Component: BottomSheetBasic }],
    props: [
      { name: "open / onOpenChange", type: "boolean", description: "Controlled state." },
      { name: "snapPoints", type: "number[]", default: "[0.92]", description: "Heights as fractions of the viewport." },
      { name: "defaultSnap / onSnapChange", type: "number", default: "0", description: "Opening snap point / settled index." },
      { name: "title / description / footer", type: "ReactNode", description: "Header and pinned footer." },
      { name: "dismissible / showClose", type: "boolean", default: "true / false", description: "Drag-to-close and close button." },
    ],
    a11y: ["Modal dialog: focus trap, Escape closes (when dismissible).", "Without motion the sheet appears without the spring."],
  },
  "action-sheet": {
    name: "Action Sheet",
    description: "A short list of choices from the bottom with a separate Cancel, as on iOS. A centered card on wide screens.",
    importName: "ActionSheet",
    demos: [{ id: "basic", title: "Photo actions", Component: ActionSheetBasic }],
    props: [
      { name: "actions", type: "{ label, onSelect?, icon?, destructive?, disabled? }[]", description: "Choices." },
      { name: "title / message", type: "ReactNode", description: "Optional header." },
      { name: "trigger / open / onOpenChange", type: "", description: "Uncontrolled with a trigger, or controlled." },
      { name: "cancelLabel", type: "ReactNode", default: '"Cancel"', description: "Cancel button text." },
    ],
  },
  "alert-dialog": {
    name: "Alert Dialog",
    description: "The iOS alert for decisions that need an answer. Two buttons sit side by side, more stack; the cancel action is bold and focused first.",
    importName: "AlertDialog",
    demos: [{ id: "basic", title: "Destructive and three-way", Component: AlertDialogBasic }],
    props: [
      { name: "title / description", type: "ReactNode", description: "Question and context." },
      { name: "actions", type: '{ label, onSelect?, role?: "default" | "cancel" | "destructive" }[]', description: "Buttons, in order." },
      { name: "trigger / open / onOpenChange", type: "", description: "Uncontrolled or controlled." },
      { name: "children", type: "ReactNode", description: "Extra content (e.g. a text field)." },
    ],
    a11y: ["role=alertdialog; it does not close on outside click.", "Focus starts on the cancel action."],
  },
  popover: {
    name: "Popover",
    description: "Interactive content anchored to a trigger: filters, pickers, short forms.",
    importName: "Popover, PopoverTrigger, PopoverContent, PopoverClose",
    demos: [{ id: "basic", title: "Filters", Component: PopoverBasic }],
    props: [
      { name: "PopoverContent", type: "side, align, sideOffset, arrow", description: "Placement and optional arrow." },
      { name: "Popover", type: "open, onOpenChange, modal", description: "Radix Popover root." },
    ],
  },
  tooltip: {
    name: "Tooltip",
    description: "A short label on hover or keyboard focus, for icon buttons. Not for essential information.",
    importName: "Tooltip",
    demos: [{ id: "basic", title: "On icon buttons", Component: TooltipBasic }],
    props: [
      { name: "content", type: "ReactNode", description: "The label." },
      { name: "side / align", type: "string", default: '"top" / "center"', description: "Placement." },
      { name: "delayDuration", type: "number", default: "400", description: "Hover delay in ms." },
      { name: "disabled", type: "boolean", description: "Render the child without a tooltip." },
    ],
  },
  toast: {
    name: "Toast",
    description: "Brief notifications from anywhere with toast(). They drop in from the top like iOS banners, pause on hover and can be swiped away.",
    importName: "Toaster, toast",
    demos: [{ id: "basic", title: "Tones, action, promise", Component: ToastBasic }],
    props: [
      { name: "toast(title, options)", type: "→ id", description: "Also toast.success / error / warning / info / loading / promise / update / dismiss." },
      { name: "options", type: "description, action, duration, icon, dismissible, id", description: "Per toast." },
      { name: "<Toaster position>", type: '"top-center" | "top-right" | "bottom-center" | "bottom-right"', default: '"top-center"', description: "Mount once." },
      { name: "<Toaster visible / duration>", type: "number", default: "3 / 4000", description: "Stack size and default time." },
    ],
    a11y: ["Polite live region; error toasts use role=alert.", "Timers pause while hovered or focused."],
  },
  alert: {
    name: "Alert",
    description: "Inline messages in the page: info, success, warning, danger, with actions and an optional dismiss.",
    importName: "Alert",
    demos: [{ id: "basic", title: "Tones and variants", align: "stretch", Component: AlertBasic }],
    props: [
      { name: "tone", type: '"info" | "success" | "warning" | "danger" | "accent" | "neutral"', default: '"info"', description: "Meaning and color." },
      { name: "variant", type: '"soft" | "surface" | "outline"', default: '"soft"', description: "Look." },
      { name: "title / actions / icon", type: "ReactNode", description: "Content (icon={false} hides it)." },
      { name: "onDismiss", type: "() => void", description: "Shows a close button." },
    ],
  },

  tabs: {
    name: "Tabs",
    description: "Switch between views of the same content. Underline with a sliding bar, pill with a sliding capsule, or soft chips.",
    importName: "Tabs, TabsList, TabsTrigger, TabsContent",
    demos: [{ id: "variants", title: "Underline, pill, soft", align: "stretch", Component: TabsVariants }],
    props: [
      { name: "value / defaultValue / onValueChange", type: "string", description: "Selected tab." },
      { name: "variant", type: '"underline" | "pill" | "soft"', default: '"underline"', description: "Look." },
      { name: "size", type: '"sm" | "md"', default: '"md"', description: "Trigger height and type." },
      { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Select on focus or on Enter (Radix)." },
    ],
    a11y: ["tablist / tab / tabpanel roles with aria-selected and aria-controls.", "Arrow keys, Home and End move between tabs."],
  },
  "segmented-control": {
    name: "Segmented Control",
    description: "The iOS segmented picker: a thumb slides under the selected segment. Text, icons, or both.",
    importName: "SegmentedControl",
    demos: [{ id: "basic", title: "Text, icons, sizes", align: "stretch", Component: SegmentedControlBasic }],
    props: [
      { name: "options", type: "{ value, label, icon?, disabled?, aria-label? }[]", description: "Segments." },
      { name: "value / defaultValue / onValueChange", type: "string", description: "Selection (one is always selected)." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Height." },
      { name: "fullWidth", type: "boolean", description: "Equal segments across the container." },
    ],
    a11y: ["A radio group: arrow keys move and select.", "Icon-only segments need an aria-label."],
  },
  breadcrumb: {
    name: "Breadcrumb",
    description: "Shows where the page sits in the hierarchy. Long paths collapse their middle into an expandable ellipsis.",
    importName: "Breadcrumb",
    demos: [{ id: "basic", title: "Icons and collapsing", align: "start", Component: BreadcrumbBasic }],
    props: [
      { name: "items", type: "{ label, href?, icon? }[]", description: "The path; the last item is the current page." },
      { name: "maxItems", type: "number", description: "Collapse the middle beyond this count." },
      { name: "renderLink", type: "(item, props) => ReactNode", description: "Render links with Next <Link>." },
      { name: "separator", type: "ReactNode", description: "Custom separator (chevron by default)." },
    ],
  },
  pagination: {
    name: "Pagination",
    description: "Move through pages: numbered with ellipses (fewer on phones), compact \"3 of 12\", or the iOS page-control dots.",
    importName: "Pagination",
    demos: [
      { id: "variants", title: "Pages, compact, dots", Component: PaginationVariants },
      { id: "range", title: "With a range summary", description: "Pass total and pageSize.", align: "stretch", Component: PaginationRange },
    ],
    props: [
      { name: "page / pageCount", type: "number", description: "Current page (1-based) and total." },
      { name: "onPageChange / getHref", type: "function", description: "Buttons, or links for crawlable pages." },
      { name: "variant", type: '"pages" | "compact" | "dots"', default: '"pages"', description: "Look." },
      { name: "siblings", type: "number", default: "1", description: "Pages on each side of the current one." },
      { name: "size", type: '"sm" | "md"', default: '"md"', description: "Button size." },
      { name: "total / pageSize", type: "number", description: "Show a \"21–40 of 134\" summary before the controls." },
      { name: "formatRange", type: "(start, end, total) => ReactNode", description: "Text of the summary." },
    ],
  },
  menu: {
    name: "Menu",
    description: "Action menus with the iOS look: trailing icons, shortcuts, destructive rows, checkmarks, submenus. ContextMenu opens the same menu on right click or long press.",
    importName: "Menu, MenuTrigger, MenuContent, MenuItem, …",
    demos: [
      { id: "basic", title: "Everything in one menu", Component: MenuBasic },
      { id: "context", title: "Context menu", description: "import { ContextMenu, … } from \"pleate/context-menu\"", Component: MenuContext },
    ],
    props: [
      { name: "MenuItem", type: "icon, shortcut, destructive, inset, disabled, onSelect", description: "One action." },
      { name: "MenuCheckboxItem / MenuRadioItem", type: "checked / value", description: "Toggles and single choice." },
      { name: "MenuSub, MenuSubTrigger, MenuSubContent", type: "", description: "Nested menu." },
      { name: "MenuContent", type: "align, side, sideOffset", description: "Placement (Radix)." },
    ],
    a11y: ["menu / menuitem roles, arrow keys, typeahead, Escape.", "Focus returns to the trigger on close."],
  },
  dropdown: {
    name: "Dropdown",
    description: "A Menu described as data: give it a trigger (or a label for a ready-made button) and a list of entries.",
    importName: "Dropdown",
    demos: [{ id: "basic", title: "Button and avatar triggers", Component: DropdownBasic }],
    props: [
      { name: "items", type: "DropdownEntry[]", description: "item | separator | label | submenu." },
      { name: "trigger / label", type: "ReactNode", description: "Custom trigger, or text for a gray Button with a chevron." },
      { name: "align / side", type: "string", default: '"start"', description: "Placement." },
    ],
  },

  container: {
    name: "Container",
    description: "Centers content with a max width and side gutters that respect the iPhone safe areas.",
    importName: "Container",
    demos: [{ id: "sizes", title: "Sizes", align: "stretch", Component: ContainerSizes }],
    props: [
      { name: "size", type: '"sm" | "md" | "lg" | "xl" | "2xl" | "full"', default: '"xl"', description: "Max width (42 → 90rem)." },
      { name: "gutter", type: '"none" | "sm" | "md" | "lg"', default: '"md"', description: "Side padding, never less than the safe area." },
      { name: "asChild", type: "boolean", description: "Apply to your own element (main, section…)." },
    ],
  },
  stack: {
    name: "Stack",
    description: "Flex column or row with a gap on the spacing scale. HStack and VStack are shorthands; direction=\"responsive\" stacks on phones.",
    importName: "Stack, HStack, VStack",
    demos: [{ id: "basic", title: "Rows, columns, responsive", align: "stretch", Component: StackBasic }],
    props: [
      { name: "direction", type: '"column" | "row" | "responsive"', default: '"column"', description: "Main axis." },
      { name: "gap", type: "number", default: "4", description: "Spacing steps of 0.25rem." },
      { name: "align / justify", type: "flex keywords", description: "Cross and main axis alignment." },
      { name: "wrap / inline / asChild", type: "boolean", description: "Wrapping, inline-flex, render on your element." },
    ],
  },
  grid: {
    name: "Grid",
    description: "Equal columns per breakpoint, or an auto-fill grid that fits as many columns as the minimum width allows.",
    importName: "Grid",
    demos: [{ id: "basic", title: "Responsive and auto-fill", align: "stretch", Component: GridBasic }],
    props: [
      { name: "columns", type: "number | { base, sm, md, lg, xl }", default: "1", description: "Each breakpoint inherits the one below." },
      { name: "minItemWidth", type: "string", description: "CSS length; switches to auto-fill." },
      { name: "gap / rowGap", type: "number", default: "4", description: "Spacing steps of 0.25rem." },
    ],
  },
  card: {
    name: "Card",
    description: "Solid rounded surface for grouped content, composed of media, header, content and footer. Interactive cards lift and press in.",
    importName: "Card, CardMedia, CardHeader, CardTitle, CardDescription, CardContent, CardFooter",
    demos: [
      { id: "variants", title: "Variants", align: "stretch", Component: CardVariants },
      { id: "composed", title: "Media, footer, interactive", align: "stretch", Component: CardComposed },
    ],
    props: [
      { name: "variant", type: '"elevated" | "flat" | "filled" | "outline" | "raised"', default: '"elevated"', description: "Surface and shadow." },
      { name: "padding", type: '"none" | "sm" | "md" | "lg"', default: '"md"', description: "Inner padding; CardMedia bleeds past it." },
      { name: "radius", type: '"lg" | "xl" | "2xl" | "3xl"', default: '"2xl"', description: "Corner radius." },
      { name: "interactive", type: "boolean", description: "Hover lift, press, focus ring (pair with asChild + a link)." },
    ],
  },
  divider: {
    name: "Divider",
    description: "Hairline separator: horizontal, vertical, inset like iOS list rows, or with a label.",
    importName: "Divider",
    demos: [{ id: "basic", title: "Inset, label, vertical", align: "stretch", Component: DividerBasic }],
    props: [
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction." },
      { name: "inset", type: "number", description: "Start inset in spacing steps." },
      { name: "label", type: "ReactNode", description: "Centered text (\"or\")." },
      { name: "decorative", type: "boolean", default: "true", description: "false exposes role=separator." },
    ],
  },
  section: {
    name: "Section",
    description: "Full-width page band with vertical rhythm, an optional heading block and a container. tone=\"dark\" pins its own theme.",
    importName: "Section",
    demos: [{ id: "tones", title: "Dark and tinted bands", align: "stretch", Component: SectionTones }],
    props: [
      { name: "tone", type: '"default" | "surface" | "muted" | "accent-soft" | "dark" | "light"', default: '"default"', description: "Background; dark/light set data-theme." },
      { name: "spacing", type: '"none" | "sm" | "md" | "lg"', default: '"md"', description: "Vertical padding." },
      { name: "eyebrow / title / description", type: "ReactNode", description: "Heading block." },
      { name: "align", type: '"start" | "center"', default: '"start"', description: "Heading alignment." },
      { name: "size", type: 'Container size | "none"', default: '"xl"', description: "Inner container width." },
    ],
  },
  navbar: {
    name: "Navbar",
    description: "Site header: brand, links and actions on desktop; a full-width menu with large links on phones. Hairline on scroll, optional hide-on-scroll.",
    importName: "Navbar, NavbarLink",
    demos: [{ id: "basic", title: "Site header", description: "Narrow the window to see the phone menu.", align: "stretch", Component: NavbarBasic }],
    props: [
      { name: "brand / actions", type: "ReactNode", description: "Start and end of the bar." },
      { name: "children", type: "NavbarLink[]", description: "Shown in the bar and in the phone menu." },
      { name: "panelFooter", type: "ReactNode", description: "Bottom of the phone menu." },
      { name: "sticky / hideOnScroll", type: "boolean", default: "true / false", description: "Scroll behavior." },
      { name: "NavbarLink active / asChild", type: "boolean", description: "Current page; use with Next <Link>." },
    ],
    a11y: ["Menu button has aria-expanded and aria-controls.", "Escape closes the phone menu; body scroll locks while open.", "Active link gets aria-current=\"page\"."],
  },
  "navigation-bar": {
    name: "Navigation Bar",
    description: "The iOS app bar: back button, centered title, actions. With largeTitle the title starts big and collapses into the bar as you scroll.",
    importName: "NavigationBar, NavigationBarBack",
    demos: [{ id: "large-title", title: "Large title", description: "Scroll inside the phone.", Component: NavigationBarLargeTitle }],
    props: [
      { name: "title / largeTitle / subtitle", type: "ReactNode / boolean", description: "Title and the large-title mode." },
      { name: "leading / trailing", type: "ReactNode", description: "Back button, actions." },
      { name: "accessory", type: "ReactNode", description: "Under the large title (search, segmented control)." },
      { name: "background", type: '"bg" | "surface"', default: '"bg"', description: "Match the screen behind." },
      { name: "scrollContainer", type: "RefObject<HTMLElement>", description: "When the scroller is not the window." },
    ],
  },
  sidebar: {
    name: "Sidebar",
    description: "iPadOS-style navigation: a sticky column (collapsible to icons) from a breakpoint up, a drawer below it.",
    importName: "Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarItem, SidebarFooter",
    demos: [{ id: "basic", title: "Groups, badges, collapse, drawer", align: "stretch", Component: SidebarBasic }],
    props: [
      { name: "open / onOpenChange", type: "boolean", description: "Drawer state below the breakpoint." },
      { name: "collapsed", type: "boolean", description: "Icon rail on desktop." },
      { name: "breakpoint", type: '"md" | "lg"', default: '"lg"', description: "Column from here up." },
      { name: "variant / selection", type: '"plain" | "surface" / "soft" | "filled"', description: "Background and selected-row style." },
      { name: "sticky / top", type: "boolean / string", description: "Sticky column and its offset." },
      { name: "SidebarItem", type: "icon, active, badge, asChild", description: "One row; closes the drawer on press." },
    ],
    a11y: ["Drawer is a modal dialog: focus trap, Escape, scroll lock.", "Collapsed rows keep their label for screen readers."],
  },
  footer: {
    name: "Footer",
    description: "Quiet, small-type footer. Link columns become tap-to-open rows on phones.",
    importName: "Footer, FooterColumns, FooterColumn, FooterLink, FooterBottom",
    demos: [{ id: "basic", title: "Site footer", align: "stretch", Component: FooterBasic }],
    props: [
      { name: "brand", type: "ReactNode", description: "Logo and pitch above the columns." },
      { name: "FooterColumn title", type: "ReactNode", description: "Column heading / disclosure button on phones." },
      { name: "FooterLink asChild", type: "boolean", description: "Use with Next <Link>." },
    ],
  },
  "tab-bar": {
    name: "Tab Bar",
    description: "iOS bottom tabs for phone layouts: classic edge-to-edge, or the floating capsule with a sliding pill. Icons swap to their filled version when active.",
    importName: "TabBar, TabBarItem, TabBarSpacer",
    demos: [{ id: "variants", title: "Classic and floating", Component: TabBarVariants }],
    props: [
      { name: "value / onValueChange", type: "string", description: "Value-driven tabs (or use active on link items)." },
      { name: "variant", type: '"classic" | "floating"', default: '"classic"', description: "Look." },
      { name: "hideFrom", type: '"never" | "md" | "lg"', default: '"never"', description: "Hide on wider screens." },
      { name: "position", type: '"fixed" | "static"', default: '"fixed"', description: "Pinned to the viewport bottom." },
      { name: "TabBarItem", type: "icon, activeIcon, label, badge, value, active, asChild", description: "One tab." },
    ],
    a11y: ["Rendered as a nav landmark; the current tab has aria-current=\"page\".", "Respects the home-indicator safe area."],
  },
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
      { name: "variant / tone / size / shape", type: "", default: '"gray"', description: "Same as Button; defaults to the gray variant." },
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
      { name: "variant / size / invalid", type: "", description: "Same as Input." },
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
      { name: "label / description / labelPlacement", type: "", description: "As Checkbox; use \"start\" for settings rows." },
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
      { name: "onClick + selected", type: "", description: "Turns the tag into a toggle button." },
      { name: "onRemove / removeLabel", type: "", description: "Adds a remove button." },
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
  "password-input": {
    name: "Password Input",
    description: "A password field with a show/hide toggle and an optional strength meter, fed by the built-in scorePassword() or your own scorer.",
    importName: "PasswordInput, scorePassword",
    demos: [{ id: "basic", title: "Toggle, strength meter, scorer", align: "stretch", Component: PasswordInputBasic }],
    props: [
      { name: "showStrength", type: "boolean", default: "false", description: "Four bars and a word under the field." },
      { name: "scorer", type: "(password) => 0 | 1 | 2 | 3 | 4", default: "scorePassword", description: "Swap in zxcvbn or your own rules." },
      { name: "defaultVisible", type: "boolean", default: "false", description: "Start with the text shown." },
      { name: "labels", type: "{ show, hide, strength, scores }", description: "Toggle names and strength words." },
      { name: "...Input props", type: "InputProps", description: "Everything Input takes (size, variant, invalid, adornments)." },
    ],
    a11y: [
      "The toggle is a button with aria-pressed and a name that says what it does; it never submits the form.",
      "The strength text is linked to the field (aria-describedby) and announced politely as it changes.",
      "scorePassword is a hint for people, not a security check: validate on the server too.",
    ],
  },
  "otp-input": {
    name: "OTP Input",
    description: "One-time codes in separate boxes: auto advance, Backspace to go back, arrows, and paste or SMS autofill of the whole code. onComplete fires when the last box is filled.",
    importName: "OTPInput",
    demos: [{ id: "basic", title: "Verify, alphanumeric, disabled", description: "Type or paste 123456.", align: "stretch", Component: OtpInputBasic }],
    props: [
      { name: "length", type: "number", default: "6", description: "Number of boxes." },
      { name: "mode", type: '"numeric" | "alphanumeric"', default: '"numeric"', description: "Allowed characters and the keyboard shown on phones." },
      { name: "value / defaultValue / onValueChange", type: "string", description: "The code." },
      { name: "onComplete", type: "(code) => void", description: "All boxes filled." },
      { name: "groupSize", type: "number", description: "A gap after every N boxes." },
      { name: "invalid / disabled / autoFocus", type: "boolean", description: "States." },
      { name: "name", type: "string", description: "Submit the joined code with the form; works inside FormField." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Box size; boxes shrink to fit narrow screens." },
    ],
    a11y: [
      "A labelled group; every box is named (\"Character 2 of 6\").",
      "The first box has autocomplete=\"one-time-code\" so phones offer the code from SMS.",
      "Inside FormField, validation runs when focus leaves the whole group, not between boxes.",
    ],
  },
  "auth-card": {
    name: "Auth Card",
    description: "The frame of sign in and sign up screens: logo, title, a line of description, the form and a footer. AuthDivider is the \"or\" rule.",
    importName: "AuthCard, AuthDivider",
    importPath: "pleate/auth/auth-card",
    demos: [{ id: "basic", title: "Welcome screen", align: "stretch", Component: AuthCardBasic }],
    props: [
      { name: "logo / title / description / footer", type: "ReactNode", description: "Content around the form." },
      { name: "variant", type: '"card" | "plain"', default: '"card"', description: "Solid surface with a shadow, or none." },
      { name: "headingLevel", type: "1 | 2 | 3", default: "1", description: "Level of the title." },
    ],
    a11y: ["The title is a real heading (h1 by default) so the page has an outline."],
  },
  "login-form": {
    name: "Login Form",
    description: "Email and password sign in with remember me, a forgot password link, a slot for social buttons and a footer. Client validation, server errors through props.",
    importName: "LoginForm",
    importPath: "pleate/auth/login-form",
    demos: [{ id: "basic", title: "Sign in to Plate", description: "Any email, password plate123.", align: "stretch", Component: LoginFormBasic }],
    props: [
      { name: "onSubmit", type: "({ email, password, remember }) => void | Promise", description: "Runs when valid; a thrown Error's message shows as the banner." },
      { name: "loading / error / fieldErrors", type: "boolean / string / Partial<Record<field, string>>", description: "Busy button, a banner above the fields, and server messages per field (they replace the client ones)." },
      { name: "forgotPasswordHref / forgotPassword", type: "string / ReactNode", description: "Link target, or your own element (Next Link)." },
      { name: "showRemember", type: "boolean", default: "true", description: "Remember me checkbox." },
      { name: "oauth / oauthPosition", type: 'ReactNode / "top" | "bottom"', default: '"top"', description: "Social buttons with an \"or\" rule." },
      { name: "footer / defaultEmail", type: "ReactNode / string", description: "Links under the form; prefilled email." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["Labels, descriptions and errors are linked to each field; the first invalid field gets focus on submit.", "autocomplete=\"username\" and \"current-password\" let password managers fill the form.", "The error banner is a role=alert region."],
  },
  "signup-form": {
    name: "Signup Form",
    description: "Create an account: name, email, a password with a live strength meter, and an optional terms checkbox that becomes required.",
    importName: "SignupForm",
    importPath: "pleate/auth/signup-form",
    demos: [{ id: "basic", title: "Create a Plate account", description: "Use an address ending in @taken.com to see a server field error.", align: "stretch", Component: SignupFormBasic }],
    props: [
      { name: "onSubmit", type: "({ name, email, password, acceptTerms }) => void | Promise", description: "Runs when valid." },
      { name: "loading / error / fieldErrors", type: "boolean / string / Partial<Record<field, string>>", description: "Busy button, a banner above the fields, and server messages per field (they replace the client ones)." },
      { name: "terms", type: "ReactNode", description: "Checkbox label with your links; shown and required when set." },
      { name: "minPasswordLength / minStrength", type: "number / 0 to 4", default: "8 / none", description: "Password rules (strength from scorePassword)." },
      { name: "showName / showStrength", type: "boolean", default: "true / true", description: "Optional parts." },
      { name: "oauth / footer / defaultValues", type: "ReactNode / ReactNode / { name, email }", description: "Slots and prefill." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["Labels, descriptions and errors are linked to each field; the first invalid field gets focus on submit.", "autocomplete=\"new-password\" lets browsers suggest a strong password."],
  },
  "forgot-password-form": {
    name: "Forgot Password Form",
    description: "Ask for the account email, then confirm that a link is on its way without revealing whether the account exists.",
    importName: "ForgotPasswordForm",
    importPath: "pleate/auth/forgot-password-form",
    demos: [{ id: "basic", title: "Request a reset link", align: "stretch", Component: ForgotPasswordFormBasic }],
    props: [
      { name: "onSubmit", type: "({ email }) => void | Promise", description: "The confirmation shows when it resolves." },
      { name: "sent / onSentChange", type: "boolean / (sent) => void", description: "Control the confirmation yourself." },
      { name: "loading / error / fieldErrors", type: "boolean / string / Partial<Record<field, string>>", description: "Busy button, a banner above the fields, and server messages per field (they replace the client ones)." },
      { name: "footer / defaultEmail", type: "ReactNode / string", description: "Back link; prefill." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["The confirmation is a status region, announced when it appears."],
  },
  "reset-password-form": {
    name: "Reset Password Form",
    description: "Choose a new password with a strength meter and confirm it. Keep the reset token in your own code and send it along.",
    importName: "ResetPasswordForm",
    importPath: "pleate/auth/reset-password-form",
    demos: [{ id: "basic", title: "New password", align: "stretch", Component: ResetPasswordFormBasic }],
    props: [
      { name: "onSubmit", type: "({ password, confirmPassword }) => void | Promise", description: "Runs when both match and pass the rules." },
      { name: "loading / error / fieldErrors", type: "boolean / string / Partial<Record<field, string>>", description: "Busy button, a banner above the fields, and server messages per field (they replace the client ones)." },
      { name: "minPasswordLength / minStrength / showStrength", type: "number / 0 to 4 / boolean", default: "8 / none / true", description: "Password rules." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["Labels, descriptions and errors are linked to each field; the first invalid field gets focus on submit."],
  },
  "two-factor-form": {
    name: "Two Factor Form",
    description: "The second step of sign in: a code that submits itself when complete, a switch to a backup code, and an optional resend with a cooldown.",
    importName: "TwoFactorForm",
    importPath: "pleate/auth/two-factor-form",
    demos: [{ id: "basic", title: "Verify a sign in", description: "Code 123456, or backup code plate-2026.", align: "stretch", Component: TwoFactorFormBasic }],
    props: [
      { name: "onSubmit", type: '({ code, method: "otp" | "backup" }) => void | Promise', description: "Throw to show the error and clear the boxes." },
      { name: "length / autoSubmit", type: "number / boolean", default: "6 / true", description: "Code length; submit on the last box." },
      { name: "allowBackupCode", type: "boolean", default: "true", description: "Offer the backup code switch." },
      { name: "onResend / resendCooldown", type: "() => void | Promise / seconds", default: "none / 30", description: "\"Send a new code\" for SMS or email codes." },
      { name: "loading / error / fieldErrors", type: "boolean / string / Partial<Record<field, string>>", description: "Busy button, a banner above the fields, and server messages per field (they replace the client ones)." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["The code group is labelled and the first box offers one-time-code autofill.", "The resend countdown is announced politely."],
  },
  "two-factor-setup": {
    name: "Two Factor Setup",
    description: "Turn on an authenticator app: scan the QR code or copy the key, confirm a code, then save the backup codes (copy or download).",
    importName: "TwoFactorSetup",
    importPath: "pleate/auth/two-factor-setup",
    demos: [{ id: "basic", title: "Three steps", description: "Confirm with 123456.", align: "stretch", Component: TwoFactorSetupBasic }],
    props: [
      { name: "qrSvg / qrSrc", type: "string", description: "SVG markup (shown as an image data URL, never injected) or an image URL." },
      { name: "secret", type: "string", description: "The key for manual entry, shown in groups of four." },
      { name: "onVerify", type: "(code) => Promise<void | { backupCodes }>", description: "Throw when the code is wrong; return the backup codes or pass backupCodes." },
      { name: "backupCodes / onDone", type: "string[] / () => void", description: "Last step." },
      { name: "step / defaultStep / onStepChange", type: '"scan" | "verify" | "backup"', default: '"scan"', description: "Control the step." },
      { name: "downloadName / downloadHeader", type: "string", default: '"backup-codes.txt"', description: "The downloaded text file." },
      { name: "error / codeLength", type: "string / number", default: "none / 6", description: "Controlled verify error; code length." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["The QR image has a text alternative and the key is always offered as text.", "Copy buttons announce \"Copied\"."],
  },
  "oauth-buttons": {
    name: "OAuth Buttons",
    description: "\"Continue with\" buttons with built-in monochrome marks for Google, GitHub and Apple, a key for anything else, links or callbacks.",
    importName: "OAuthButtons",
    importPath: "pleate/auth/oauth-buttons",
    demos: [{ id: "basic", title: "Stacked, in a row, custom provider", align: "stretch", Component: OAuthButtonsBasic }],
    props: [
      { name: "providers", type: "{ id, name, href?, icon? }[]", description: "google, github and apple get a mark; others a key or your icon." },
      { name: "onSelect", type: "(id) => void", description: "Called on press (also before following an href)." },
      { name: "loadingId", type: "string | null", description: "Spinner on that provider, others disabled." },
      { name: "layout", type: '"stack" | "row"', default: '"stack"', description: "Rows, or side by side (icons only on phones with three or more)." },
      { name: "size / disabled", type: '"md" | "lg" / boolean', default: '"md"', description: "Look and state." },
      { name: "labels.continueWith", type: "(name) => string", description: "Button text." },
    ],
    a11y: ["Icon-only buttons keep their full name (\"Continue with Apple\").", "Marks are decorative and hidden from screen readers."],
  },
  "notification-center": {
    name: "Notification Center",
    description: "An inbox grouped into Today and Earlier with unread dots, time ago, mark read, mark all read, delete, skeletons, an empty state and load more. NotificationBell opens it from a bell with a count.",
    importName: "NotificationBell, NotificationCenter",
    demos: [{ id: "basic", title: "Bell, inline, loading and empty", description: "Open the bell, mark items read, load more.", align: "stretch", Component: NotificationCenterBasic }],
    props: [
      { name: "items", type: "{ id, title, body?, createdAt, read, href?, kind?, icon? }[]", description: "Notifications, newest first." },
      { name: "unreadCount", type: "number", default: "unread items", description: "Badge and header count (e.g. from the server)." },
      { name: "onMarkRead / onMarkAllRead / onDelete", type: "(id) => void / () => void / (id) => void", description: "Actions; delete shows only when set." },
      { name: "onLoadMore / hasMore / loading", type: "() => void / boolean / boolean", description: "Paging; loading shows skeletons when empty." },
      { name: "icons", type: "Record<kind, ReactNode>", description: "Icon per kind." },
      { name: "onSelect / now / locale", type: "(item) => void / Date / string", description: "Row press, reference time, formatting." },
      { name: "Bell: open / onOpenChange / align / bellLabel", type: "", description: "Popover control and the bell's accessible name." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: [
      "The bell's name includes the unread count (\"Notifications, 2 unread\").",
      "Unread rows say so to screen readers; every action button is named after its notification.",
      "The popover traps focus while open; Escape closes it and returns focus to the bell.",
    ],
  },
  "data-table": {
    name: "Data Table",
    description: "Table, SearchBar, Pagination, Skeleton and EmptyState in one server-friendly table: it renders what you pass and reports sorting, searching, paging and selection.",
    importName: "DataTable",
    demos: [{ id: "basic", title: "Members, from a pretend API", description: "Sort, search, filter by role, select rows, page through 134 members.", align: "stretch", Component: DataTableBasic }],
    props: [
      { name: "columns", type: "{ key, header, cell?, sortable?, align?, width?, nowrap? }[]", description: "Columns; cell defaults to row[key]." },
      { name: "rows / getRowId", type: "T[] / (row) => string", description: "The current page." },
      { name: "sort / onSortChange", type: '{ key, direction: "asc" | "desc" } | null', description: "Sortable headers toggle the direction." },
      { name: "search / onSearchChange / debounceMs", type: "string / (value) => void / number", default: "300", description: "Shows the search field; debounced." },
      { name: "page / pageCount / total / pageSize / onPageChange", type: "number", description: "Pagination with a \"21–40 of 134\" summary." },
      { name: "loading", type: "boolean", description: "Skeleton rows." },
      { name: "empty", type: "{ icon, title, description, actions }", description: "Empty state (a no results text while searching)." },
      { name: "toolbar / selectionActions", type: "ReactNode", description: "Filters; bulk actions while rows are selected." },
      { name: "selectedIds / onSelectionChange", type: "string[] / (ids) => void", description: "Checkbox column." },
      { name: "onRowClick / density / caption", type: '(row) => void / "comfortable" | "compact" / ReactNode', description: "Row press, row height, caption." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: [
      "Sortable headers are buttons with aria-sort; checkboxes are named per row.",
      "Clickable rows are focusable and open with Enter or Space.",
      "The table is aria-busy while loading; wide tables scroll inside their card.",
    ],
  },
  "session-list": {
    name: "Session List",
    description: "Where the account is signed in: browser and OS, IP, location and last activity per device, with sign out per row and everywhere else after a confirmation.",
    importName: "SessionList",
    demos: [{ id: "basic", title: "Active sessions", align: "stretch", Component: SessionListBasic }],
    props: [
      { name: "sessions", type: "{ id, browser, os, mobile, ip?, location?, lastSeenAt, current }[]", description: "The current one comes first, marked \"This device\"." },
      { name: "onRevoke", type: "(id) => void | Promise", description: "Per row; spins while the promise runs." },
      { name: "onRevokeOthers", type: "() => void | Promise", description: "After an AlertDialog confirmation." },
      { name: "revokingIds / loading", type: "string[] / boolean", description: "External busy rows; skeleton while empty." },
      { name: "showTitle / now / locale", type: "boolean / Date / string", description: "Heading and time formatting." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["Each Sign out button names the session (\"Sign out Chrome on Windows\").", "Signing out everywhere asks first, with focus on Cancel."],
  },
  "api-key-list": {
    name: "API Key List",
    description: "API keys with masked prefixes, scope badges, created, last used and expiry; a create dialog that reveals the new key once with a copy button; revoke behind a confirmation.",
    importName: "ApiKeyList",
    demos: [{ id: "basic", title: "Keys for the Plate API", description: "Create a key to see the reveal-once panel.", align: "stretch", Component: ApiKeyListBasic }],
    props: [
      { name: "keys", type: "{ id, name, prefix, scopes, createdAt, lastUsedAt?, expiresAt? }[]", description: "Shown as prefix_••••; expired keys are dimmed." },
      { name: "scopes / defaultScopes", type: "{ value, label, description? }[] / string[]", description: "Choices in the create dialog." },
      { name: "expiryOptions / defaultExpiry", type: "{ value, label, days | null }[] / string", default: "30, 90, 365 days, never", description: "Expiry select." },
      { name: "onCreate", type: "({ name, scopes, expiresInDays }) => Promise<{ key }>", description: "Resolve with the full key; throw to show an error." },
      { name: "onRevoke", type: "(id) => void | Promise", description: "After confirmation; the row spins meanwhile." },
      { name: "loading / toolbar / now / locale", type: "boolean / ReactNode / Date / string", description: "Skeleton, header slot, formatting." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["The secret is shown once, selectable, with a copy button that announces \"Copied\".", "Revoking asks first; rows become labelled cards on phones."],
  },
  contact: {
    name: "Contact Form",
    description: "Name, email, an optional subject and the message, validated on the client, with a success panel and a hidden honeypot field named website.",
    importName: "ContactForm",
    importPath: "pleate/marketing/contact",
    demos: [{ id: "basic", title: "Talk to the team", align: "stretch", Component: ContactBasic }],
    props: [
      { name: "onSubmit", type: "({ name, email, subject?, message, website }) => void | Promise", description: "website is the honeypot: drop submissions where it isn't empty." },
      { name: "showSubject / minMessageLength / maxMessageLength", type: "boolean / number / number", default: "true / 10 / 2000", description: "Fields and rules." },
      { name: "loading / error / fieldErrors", type: "boolean / string / object", description: "Server state." },
      { name: "sent / onSentChange / footnote", type: "boolean / (sent) => void / ReactNode", description: "Success panel control; a note under the button." },
      { name: "labels", type: "object", description: "Every visible string, for your wording or translation." },
    ],
    a11y: ["Labels, descriptions and errors are linked to each field; the first invalid field gets focus on submit.", "The honeypot is out of the tab order and hidden from screen readers.", "The success panel is a status region."],
  },
};
