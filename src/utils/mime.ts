import { IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { decodeContentType } from '@spore-sdk/core';

export { IMAGE_MIME_TYPE };
export const TEXT_MIME_TYPE = ['text/markdown', 'text/plain'];

export const SUPPORTED_MIME_TYPE = [...IMAGE_MIME_TYPE, ...TEXT_MIME_TYPE, 'dob/0'];

export function getMIMETypeByName(name: string) {
  const extension = name.split('.').pop();

  if (extension === 'md') {
    return 'text/markdown';
  }
  if (extension === 'txt') {
    return 'text/plain';
  }
  if (extension === 'dob0') {
    return 'dob/0';
  }
  return '';
}

export function isSupportedMIMEType(contentType: string | undefined | null) {
  if (!contentType) {
    return false;
  }
  const { type, subtype } = decodeContentType(contentType);
  return SUPPORTED_MIME_TYPE.includes(`${type}/${subtype}`);
}

export function isImageMIMEType(contentType: string | undefined | null) {
  if (!contentType) {
    return false;
  }
  const { type, subtype } = decodeContentType(contentType);
  return IMAGE_MIME_TYPE.includes(`${type}/${subtype}` as any);
}

export function isTextMIMEType(contentType: string | undefined | null) {
  if (!contentType) {
    return false;
  }
  const { type, subtype } = decodeContentType(contentType);
  return TEXT_MIME_TYPE.includes(`${type}/${subtype}`);
}
