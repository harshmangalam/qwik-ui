import { type JSXNode, Component } from '@builder.io/qwik';
import { SelectImpl, type SelectProps } from './select';
import { SelectListbox } from './select-listbox';
import { SelectOption } from './select-option';
import { SelectGroup } from './select-group';
import { SelectPopover } from './select-popover';

export type Opt = {
  isDisabled: boolean;
  value: string;
  displayValue?: string;
};

/*
    This is an inline component. We create an inline component to get the proper indexes with CSR. See issue #4757 
    for more information.
*/
export const Select: Component<SelectProps> = (props: SelectProps) => {
  const { children: myChildren, ...rest } = props;
  let valuePropIndex = null;
  const childrenToProcess = (
    Array.isArray(myChildren) ? [...myChildren] : [myChildren]
  ) as Array<JSXNode>;

  let currentIndex = 0;
  const opts: Opt[] = [];

  while (childrenToProcess.length) {
    const child = childrenToProcess.shift();

    if (!child) {
      continue;
    }

    if (Array.isArray(child)) {
      childrenToProcess.unshift(...child);
      continue;
    }

    switch (child.type) {
      case SelectPopover: {
        const popoverChildren = Array.isArray(child.props.children)
          ? [...child.props.children]
          : [child.props.children];
        childrenToProcess.unshift(...popoverChildren);
        break;
      }
      case SelectListbox: {
        const listboxChildren = Array.isArray(child.props.children)
          ? [...child.props.children]
          : [child.props.children];
        childrenToProcess.unshift(...listboxChildren);
        break;
      }
      case SelectGroup: {
        const listboxChildren = Array.isArray(child.props.children)
          ? [...child.props.children]
          : [child.props.children];
        childrenToProcess.unshift(...listboxChildren);
        break;
      }
      case SelectOption: {
        const isString = typeof child.props.children === 'string';
        if (!isString) {
          throw new Error(
            `Qwik UI: Select option value passed was not a string. It was a ${typeof child
              .props.children}.`,
          );
        }

        child.props._index = currentIndex;
        const isDisabled = child.props.disabled === true;
        const value = (
          child.props.value ? child.props.value : child.props.children
        ) as string;

        const opt: Opt = {
          isDisabled,
          value,
          displayValue: child.props.children as string,
        };

        opts.push(opt);

        if (value === props.value) {
          valuePropIndex = currentIndex;
        }

        currentIndex++;
      }
    }
  }
  const isDisabledArr = opts.map((opt) => opt.isDisabled);

  if (valuePropIndex !== null && isDisabledArr[valuePropIndex] === true) {
    valuePropIndex = isDisabledArr.findIndex((isDisabled) => isDisabled === false);
    if (valuePropIndex === -1) {
      throw new Error(
        `Qwik UI: it appears you've disabled every option in the select. Was that intentional? 🤨`,
      );
    }
  }

  // console warning if a consumer's passed in value does not match an option
  if (props.value) {
    const valueMatch = opts.some((opt) => opt.value === props.value);

    if (!valueMatch) {
      console.error(
        `Qwik UI: the provided option value "${props.value}" does not match any of the option values in the Select.`,
      );
    }
  }

  return (
    <SelectImpl {...rest} _valuePropIndex={valuePropIndex} _options={opts}>
      {props.children}
    </SelectImpl>
  );
};