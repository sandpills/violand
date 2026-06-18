export const LINK_TYPES = ["site", "watch", "listen", "access"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export interface TypedLink {
    type: LinkType;
    url: string;
}

export function getTypedLinks(data: Record<string, any>): TypedLink[] {
    return LINK_TYPES.filter((t) => data[t]).map((t) => ({
        type: t,
        url: data[t] as string,
    }));
}
