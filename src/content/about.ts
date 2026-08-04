// The homepage bio, as data.
//
// This used to be fetched at runtime from a GitHub profile README through a
// public CORS proxy. The request could never succeed (wrong repo path, and the
// proxy requires per-IP opt-in), so every visitor got a loading flash, a console
// error, and then a hardcoded fallback. The fallback was the real content, so
// it lives here now.

export interface AboutLine {
  /** Rendered dimmer, for the `formerly:` style labels. */
  label?: boolean;
  text?: string;
  link?: { href: string; text: string };
}

export const aboutLines: AboutLine[] = [
  { text: 'backend, platform, and site reliability @pinginc (Staff Software Engineer)' },
  {},
  { text: 'formerly:', label: true },
  {},
  { text: 'kubernetes controllers @Nike-Inc (Senior Software Engineer/Software Engineer II)' },
  { text: 'backend, platform, and site reliability @pinginc (Senior Software Engineer)' },
  { text: 'observability integrations and site reliability @VirtualInstruments (SRE)' },
  {},
  { text: 'also formerly (but short lived):', label: true },
  {},
  { text: 'kubernetes controllers, multicloud k8s, react @shipyard (Senior Software Engineer)' },
  { text: 'multicloud and baremetal kubernetes @dgraph-io (Site Reliability Engineer)' },
  {},
  { text: 'i like:', label: true },
  {},
  { text: 'distributed systems' },
  { text: 'platform and infrastructure' },
  { text: 'designing for scale' },
  {},
  { text: 'connect:', label: true },
  {},
  { link: { href: 'https://github.com/roshbhatia', text: 'github.com/roshbhatia' } },
  { link: { href: 'https://linkedin.com/in/roshanbhatia', text: 'linkedin.com/in/roshanbhatia' } },
];
