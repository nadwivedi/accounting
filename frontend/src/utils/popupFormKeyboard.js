const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([disabled]):not([readonly])',
  'select:not([disabled]):not([readonly])',
  'textarea:not([disabled]):not([readonly])'
].join(', ');

const NON_EDITABLE_INPUT_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'file'
]);

const isVisibleField = (element) => {
  if (!element) return false;
  if (element.tabIndex === -1) return false;

  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const getFormFields = (form) => (
  Array.from(form.querySelectorAll(FIELD_SELECTOR)).filter(isVisibleField)
);

const focusField = (element) => {
  if (!element) return;
  element.focus();
  if (element instanceof HTMLInputElement && typeof element.select === 'function') {
    element.select();
  }
};

export const handlePopupFormKeyDown = (event, onClose) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    if (typeof onClose === 'function') onClose();
    return;
  }

  const form = target.closest('form');
  if (!form) return;

  const fields = getFormFields(form);
  const currentIndex = fields.indexOf(target);
  if (currentIndex === -1) return;

  if (event.key === 'Enter' && !event.shiftKey) {
    if (target instanceof HTMLInputElement && NON_EDITABLE_INPUT_TYPES.has(target.type)) {
      return;
    }
    const nextField = fields[currentIndex + 1];
    if (nextField) {
      event.preventDefault();
      focusField(nextField);
    }
    return;
  }

  if (event.key === 'Backspace') {
    if (target instanceof HTMLInputElement && NON_EDITABLE_INPUT_TYPES.has(target.type)) {
      return;
    }
    if (
      typeof target.value !== 'string' ||
      target.value.length > 0 ||
      (typeof target.selectionStart === 'number' && target.selectionStart > 0)
    ) {
      return;
    }

    const previousField = fields[currentIndex - 1];
    if (previousField) {
      event.preventDefault();
      focusField(previousField);
    }
  }
};
