import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom does not implement scrolling; real browsers do. Stubbed so components that keep
// a highlighted option in view can be tested.
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
