# Grill-Me Protocol

Relentless interview protocol for reaching shared understanding on a plan, design, or specification.

## When to Use

Invoke this protocol during any interactive specification or design gathering phase where surface-level answers risk leaving ambiguity. Currently integrated into:

- **Setup**: Sections 2.1 (Product Definition), 2.2 (Product Guidelines), 2.3 (Tech Stack)
- **New Track**: Section 2.2 (Interactive Specification Gathering)

## Protocol

### 1. Opening

Announce the grilling session:

> "I'm going to grill you on this to make sure we're fully aligned. I'll ask one question at a time, provide my recommendation, and we'll resolve each decision before moving on."

### 2. Iterative Questioning

For each area of the design tree:

1. **Identify the next unresolved decision** based on the conversation so far and any prior answers.
2. **If the answer can be inferred from the codebase** (brownfield projects), explore the codebase first using search and read tools. Present what you found and ask the user to confirm or correct.
3. **If the answer requires user input**, ask a single question:
   - State the question clearly.
   - Provide your **recommended answer** with brief rationale.
   - Present 2-3 alternative options.
   - Allow "Type your own answer" as the final option.
4. **Wait for the user's response.**
5. **Resolve the answer**: Confirm your understanding. If the answer introduces new dependent decisions (branches), add them to the queue before continuing.
6. **Summarize understanding** before moving to the next question: "So we agree on X. Moving on..."

### 3. Depth Rules

- **Never accept vague answers without follow-up.** If an answer is ambiguous (e.g., "make it fast", "use standard tools"), follow up immediately: "When you say X, do you mean A or B?"
- **Resolve dependencies before siblings.** If decision B depends on decision A, resolve A first. Walk the tree depth-first.
- **Max 3 follow-ups per branch.** If a branch requires more than 3 follow-up clarifications, summarize the tension point and ask the user to make a holistic call.
- **Surface hidden decisions.** If two answers create an implicit constraint (e.g., choosing PostgreSQL + serverless creates connection pooling concerns), call it out explicitly.

### 4. Completion

When all branches are resolved:

1. Summarize the full set of decisions made.
2. Highlight any remaining assumptions or risks.
3. Proceed to the next phase of the parent workflow (draft the document, generate the spec, etc.).

## Integration Pattern

To integrate this protocol into a workflow step:

1. Replace or augment the existing "Ask N questions sequentially" block with a reference to this protocol.
2. Define the **root questions** (the top of the decision tree) in the calling workflow. The grill-me protocol handles depth from there.
3. Collect all resolved answers and feed them into the document generation step.

Example integration:

```markdown
### 2.1 Product Definition (product.md)

1. Announce creating **Product Definition**
2. **Invoke Grill-Me Protocol** (see references/grill-me.md) with root questions:
   - Who are the target users?
   - What is the primary goal of this product?
   - What are the core features?
3. Draft `product.md` based on resolved decisions
4. Present for review with options: Approve / Suggest Changes
```
