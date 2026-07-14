export type CodernicIconsId =
  | "codernic-logo";

export type CodernicIconsKey =
  | "CodernicLogo";

export enum CodernicIcons {
  CodernicLogo = "codernic-logo",
}

export const CODERNIC_ICONS_CODEPOINTS: { [key in CodernicIcons]: string } = {
  [CodernicIcons.CodernicLogo]: "61697",
};
