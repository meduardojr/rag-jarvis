import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const Slider = SliderPrimitive.Root;

const SliderTrack = SliderPrimitive.Track;

const SliderRange = SliderPrimitive.Range;

const SliderThumb = SliderPrimitive.Thumb;

const SliderLabel = SliderPrimitive.Label;

const SliderValue = SliderPrimitive.Value;

export {
  Slider,
  SliderTrack,
  SliderRange,
  SliderThumb,
  SliderLabel,
  SliderValue,
};