export declare const world: {
    registerEntity: ({ id, idSuffix }?: {
        id?: string | undefined;
        idSuffix?: string | undefined;
    }) => import("@latticexyz/recs").Entity;
    components: import("@latticexyz/recs").Component<import("@latticexyz/recs").Schema, import("@latticexyz/recs").Metadata, unknown>[];
    registerComponent: (component: import("@latticexyz/recs").Component) => void;
    dispose: (namespace?: string) => void;
    registerDisposer: (disposer: () => void, namespace?: string) => void;
    hasEntity: (entity: import("@latticexyz/recs").Entity) => boolean;
    getEntities: () => IterableIterator<import("@latticexyz/recs").Entity>;
    entitySymbols: Set<import("@latticexyz/recs").EntitySymbol>;
    deleteEntity: (entity: import("@latticexyz/recs").Entity) => void;
};
