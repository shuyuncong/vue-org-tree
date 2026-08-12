import { toPng, toSvg } from 'html-to-image'
import { HierarchyError } from './errors'
import type { ImageExportOptions, ImageExportResult } from './types'

function getDimensions(element: HTMLElement, options: ImageExportOptions) {
  const bounds = element.getBoundingClientRect()
  return {
    width: Math.max(1, Math.round(options.width ?? element.scrollWidth ?? bounds.width)),
    height: Math.max(1, Math.round(options.height ?? element.scrollHeight ?? bounds.height))
  }
}

async function render<F extends 'png' | 'svg'>(
  element: HTMLElement,
  format: F,
  options: ImageExportOptions = {}
): Promise<ImageExportResult<F>> {
  try {
    const { width, height } = getDimensions(element, options)
    const renderOptions = {
      width,
      height,
      pixelRatio: options.pixelRatio ?? 1,
      backgroundColor: options.backgroundColor ?? '#ffffff',
      cacheBust: true
    }
    const dataUrl = format === 'png'
      ? await toPng(element, renderOptions)
      : await toSvg(element, renderOptions)
    return { format, dataUrl, width, height }
  } catch (error) {
    throw new HierarchyError('EXPORT_FAILED', error instanceof Error ? error.message : 'Unable to export hierarchy image')
  }
}

export function exportHierarchyPng(element: HTMLElement, options?: ImageExportOptions) {
  return render(element, 'png', options)
}

export function exportHierarchySvg(element: HTMLElement, options?: ImageExportOptions) {
  return render(element, 'svg', options)
}
