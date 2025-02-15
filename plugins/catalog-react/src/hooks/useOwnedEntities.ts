/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { catalogApiRef } from './../api';
import {
  loadCatalogOwnerRefs,
  loadIdentityOwnerRefs,
} from './useEntityOwnership';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Entity, RELATION_OWNED_BY } from '@backstage/catalog-model';
import { CatalogListResponse } from '@backstage/catalog-client';
import { useAsync } from 'react-use';
import { useMemo } from 'react';

/**
 * Takes the relevant parts of the Backstage identity, and translates them into
 * a list of entities which are owned by the user. Takes an optional parameter
 * to filter the entities based on allowedKinds
 *
 * @public
 *
 * @param allowedKinds - Array of allowed kinds to filter the entities
 * @returns CatalogListResponse<Entity>
 */
export function useOwnedEntities(allowedKinds?: string[]): {
  loading: boolean;
  ownedEntities: CatalogListResponse<Entity> | undefined;
} {
  const identityApi = useApi(identityApiRef);
  const catalogApi = useApi(catalogApiRef);

  const { loading, value: refs } = useAsync(async () => {
    const identityRefs = await loadIdentityOwnerRefs(identityApi);
    const catalogRefs = await loadCatalogOwnerRefs(catalogApi, identityRefs);
    const catalogs = await catalogApi.getEntities(
      allowedKinds
        ? {
            filter: {
              kind: allowedKinds,
              [`relations.${RELATION_OWNED_BY}`]:
                [...identityRefs, ...catalogRefs] || [],
            },
          }
        : {
            filter: {
              [`relations.${RELATION_OWNED_BY}`]:
                [...identityRefs, ...catalogRefs] || [],
            },
          },
    );
    return catalogs;
  }, []);

  const ownedEntities = useMemo(() => {
    return refs;
  }, [refs]);

  return useMemo(() => ({ loading, ownedEntities }), [loading, ownedEntities]);
}
