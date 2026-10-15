import { Page, Section, Cell, List } from "@/kit";

export default function Prototype() {
  return (
    <Page title="__TITLE__" background="grouped">
      <List>
        <Section header="Getting started">
          <Cell title="Edit src/prototypes/__SLUG__/index.tsx" />
        </Section>
      </List>
    </Page>
  );
}
