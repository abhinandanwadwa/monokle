import * as Rt from 'runtypes';

import {ResourceIdentifier, ResourceIdentifierRuntype, ResourceStorage} from './k8sResource';

const FileSelectionRuntype = Rt.Record({
  type: Rt.Literal('file'),
  filePath: Rt.String,
});

const HelmValuesFileSelectionRuntype = Rt.Record({
  type: Rt.Literal('helm.values.file'),
  valuesFileId: Rt.String,
});

export type ResourceSelection<Storage extends ResourceStorage = ResourceStorage> = {
  type: 'resource';
  resourceIdentifier: ResourceIdentifier<Storage>;
};

const ResourceSelectionRuntype: Rt.Runtype<ResourceSelection> = Rt.Record({
  type: Rt.Literal('resource'),
  resourceIdentifier: ResourceIdentifierRuntype,
});

const ImageSelectionRuntype = Rt.Record({
  type: Rt.Literal('image'),
  imageId: Rt.String,
});

const CommandSelectionRuntype = Rt.Record({
  type: Rt.Literal('command'),
  commandId: Rt.String,
});

const PreviewConfigurationSelectionRuntype = Rt.Record({
  type: Rt.Literal('preview.configuration'),
  previewConfigurationId: Rt.String,
});

const AppSelectionRuntype = Rt.Union(
  FileSelectionRuntype,
  HelmValuesFileSelectionRuntype,
  ResourceSelectionRuntype,
  ImageSelectionRuntype,
  CommandSelectionRuntype,
  PreviewConfigurationSelectionRuntype
);

export type FileSelection = Rt.Static<typeof FileSelectionRuntype>;
export type HelmValuesFileSelection = Rt.Static<typeof HelmValuesFileSelectionRuntype>;
export type ImageSelection = Rt.Static<typeof ImageSelectionRuntype>;
export type CommandSelection = Rt.Static<typeof CommandSelectionRuntype>;
export type PreviewConfigurationSelection = Rt.Static<typeof PreviewConfigurationSelectionRuntype>;
export type AppSelection = Rt.Static<typeof AppSelectionRuntype>;

export const isFileSelection = FileSelectionRuntype.guard;
export const isHelmValuesFileSelection = HelmValuesFileSelectionRuntype.guard;
export const isResourceSelection = ResourceSelectionRuntype.guard;
export const isImageSelection = ImageSelectionRuntype.guard;
export const isCommandSelection = CommandSelectionRuntype.guard;
export const isPreviewConfigurationSelection = PreviewConfigurationSelectionRuntype.guard;
export const isAppSelection = AppSelectionRuntype.guard;
