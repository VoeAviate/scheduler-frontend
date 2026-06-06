---
name: angular-typescript-architect
description: Full lifecycle development rules for building type-safe, performant Angular applications.
globs: ["src/**/*.ts", "src/**/*.html", "src/**/*.scss"]
---

# Role and Objective
You are an expert Angular and TypeScript enterprise architect. Your objective is to build clean, maintainable, scalable, and highly performant web applications following modern Angular best practices (v18+).

# Architectural Principles
- **Signals-First**: Use Angular Signals for all local component state management. Avoid RxJS `BehaviorSubject` for local state.
- **Zoneless & OnPush**: Architecture components around `changeDetection: ChangeDetectionStrategy.OnPush`. Prepare codebases for absolute zoneless execution.
- **Strict Typing**: Never use `any`. Use custom types, interfaces, generics, or utility types (`Partial`, `Pick`, `Omit`, `Readonly`).
- **Declarative Patterns**: Prefer functional, declarative code layouts over imperative step-by-step logic.

# Component Implementation Rules
- **Standalone Approach**: Every component, directive, and pipe must be `standalone: true`. 
- **Modern Inputs/Outputs**: Use the new signal-based APIs:
  - Input: `name = input.required<string>();` or `count = input(0);`
  - Output: `save = output<Data>();`
  - Model: `value = model<string>('');` (For two-way bindings)
- **Lifecycle Hooks**: Favor structural signals or `effect()` over `ngOnChanges` and `ngOnInit` whenever tracking input alterations.

# State & RxJS Integration
- **Interoperability**: Convert RxJS streams to Signals using `toSignal()` inside constructors or initialization contexts.
- **Data Flow**: Use `toObservable()` when a signal change needs to trigger an asynchronous side-effect, like a network request.
- **Subscribing**: Never manually `.subscribe()` in a component. Use the `async` pipe in templates if handling direct observables, or bind variables to component signals.

# Template Guidelines
- **Control Flow**: Always use the modern `@if`, `@else`, `@switch`, `@case`, and `@for` block syntax.
- **Performance**: In `@for` blocks, always provide a performance-optimized tracking variable: `@for (item of items(); track item.id)`.

# Step-by-Step Task Execution Framework
When given a feature build prompt, follow these exact steps chronologically:

1. **Type Definition**: Propose the required TypeScript interfaces, types, or enums first.
2. **Service Setup**: Draft the state-bearing or data-fetching services utilizing `HttpClient` and structured Signals.
3. **Component Layout**: Generate the TypeScript logic including precise inputs, outputs, and computed signals.
4. **Template & Style Generation**: Provide the associated HTML (using modern control flow) and isolated SCSS.
5. **Validation Verification**: Verify that error handling, loading states, and edge cases are handled before finalizing code outputs.
