<script setup lang="ts">
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'
</script>

<template>
  <section class="flex max-w-content-narrow flex-col gap-gap-sm p-4">
    <h2 class="text-lg font-semibold text-foreground">Billing questions</h2>
    <Accordion default-value="billing">
      <AccordionItem value="billing">
        <AccordionTrigger>When am I billed?</AccordionTrigger>
        <AccordionContent>
          On the first day of each month, for the seats in use that day. Seats you add mid-month are
          charged for the days left, on the next invoice.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="export">
        <AccordionTrigger>Can I export my data?</AccordionTrigger>
        <AccordionContent>Yes, as CSV from Settings, at any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="refund">
        <AccordionTrigger>Can I get a refund for unused seats?</AccordionTrigger>
        <AccordionContent>
          Seats removed before the end of a month are credited to the next invoice.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="sso" disabled>
        <AccordionTrigger>Single sign-on (Enterprise plan)</AccordionTrigger>
        <AccordionContent>Available on the Enterprise plan.</AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
</template>
