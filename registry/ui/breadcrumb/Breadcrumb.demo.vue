<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '.'
</script>

<template>
  <div class="flex flex-col gap-gap-lg p-4">
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#website">Website redesign</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Homepage hero</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
    <Breadcrumb nav-label="Settings breadcrumb">
      <BreadcrumbItem>
        <BreadcrumbLink href="#settings">Settings</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbLink href="#workspace">Workspace</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbLink href="#members">Members and permissions</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator>/</BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbPage>Invite people to the Acme design workspace</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  </div>
</template>
