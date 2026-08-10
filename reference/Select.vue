<script setup lang="ts">

defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const selectId = useId()
</script>

<template>
  <UiField :for-id="selectId" :label="label" cursor="pointer">
    <div class="flex items-center relative">
      <select 
        :id="selectId"
        :value="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        class="w-full bg-transparent outline-none text-base font-semibold text-base-content appearance-none cursor-pointer pr-8"
      >
        <slot></slot>
      </select>
      <Icon name="i-heroicons-chevron-down" class="absolute right-0 w-4 h-4 text-base-content/40 pointer-events-none group-focus-within:text-primary transition-colors" />
    </div>
  </UiField>
</template>
