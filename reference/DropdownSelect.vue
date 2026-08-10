<script setup lang="ts">
import type { PropType } from 'vue'
import { useDropdownAnimation } from '~/composables/useDropdownAnimation'
import { useFloatingDropdown } from '~/composables/useFloatingDropdown'

export interface DropdownSelectOption {
  value: string
  label?: string
  icon?: string
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array as PropType<DropdownSelectOption[]>,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Seleccionar'
  },
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { isOpen, triggerRef, panelRef, style, close, toggle } = useFloatingDropdown()
const { onEnter: ddEnter, onLeave: ddLeave } = useDropdownAnimation()

const selectedOption = computed(() => props.options.find(opt => opt.value === props.modelValue))

function select(value: string) {
  emit('update:modelValue', value)
  close()
}
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      class="btn border-none justify-between font-semibold transition-all w-full"
      :class="[
        size === 'sm' ? 'btn-xs h-8 min-h-8 px-2.5 rounded-lg text-xs' : 'btn-md rounded-xl',
        disabled ? 'bg-base-200/30 opacity-80 cursor-not-allowed' : 'bg-base-200/50 hover:bg-base-200'
      ]"
      @click="toggle"
    >
      <span class="flex items-center gap-2 text-base-content/80 min-w-0">
        <Icon v-if="selectedOption?.icon" :name="selectedOption.icon" class="shrink-0 opacity-80" :class="size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'" />
        <span class="truncate">{{ selectedOption?.label || selectedOption?.value || placeholder }}</span>
      </span>
      <Icon v-if="!disabled" name="i-heroicons-chevron-down" class="opacity-80 transition-transform shrink-0" :class="[size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4', { 'rotate-180': isOpen }]" />
    </button>

    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[104]" @click="close"></div>
      <Transition :css="false" @enter="ddEnter" @leave="ddLeave">
        <div
          v-if="isOpen"
          ref="panelRef"
          class="dropdown-select-panel fixed z-[105] bg-base-100 border border-base-200 rounded-2xl py-1.5 shadow-xl max-h-56 overflow-y-auto"
          :style="style"
          @click.stop
        >
          <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-base-200/70 transition-colors text-left w-full whitespace-nowrap"
            :class="opt.value === modelValue ? 'text-base-content surface-success' : 'text-base-content/80'"
            @click="select(opt.value)"
          >
            <Icon v-if="opt.icon" :name="opt.icon" class="w-4 h-4 shrink-0" />
            <span class="truncate">{{ opt.label || opt.value }}</span>
            <Icon v-if="opt.value === modelValue" name="i-heroicons-check" class="w-4 h-4 ml-auto text-success shrink-0" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown-select-panel::-webkit-scrollbar {
  width: 5px;
}
.dropdown-select-panel::-webkit-scrollbar-track {
  background: transparent;
}
.dropdown-select-panel::-webkit-scrollbar-thumb {
  background: var(--fallback-bc, oklch(var(--bc)/0.2));
  border-radius: 10px;
}
</style>
