import {
  Button,
  Divider,
  Menu,
  PropertyCollapsibleContent,
  PropertyCollapsibleSection,
} from '@yunke/component';
import { BacklinkGroups } from '@yunke/core/blocksuite/block-suite-editor/bi-directional-link-panel';
import { CreatePropertyMenuItems } from '@yunke/core/components/properties/menu/create-doc-property';
import { WorkspacePropertyRow } from '@yunke/core/components/properties/table';
import type { DocCustomPropertyInfo } from '@yunke/core/modules/db';
import { DocDatabaseBacklinkInfo } from '@yunke/core/modules/doc-info';
import type {
  DatabaseRow,
  DatabaseValueCell,
} from '@yunke/core/modules/doc-info/types';
import { DocsSearchService } from '@yunke/core/modules/docs-search';
import { GuardService } from '@yunke/core/modules/permissions';
import { WorkspacePropertyService } from '@yunke/core/modules/workspace-property';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { PlusIcon } from '@blocksuite/icons/rc';
import { LiveData, useLiveData, useServices } from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './info-modal.css';
import { LinksRow } from './links-row';

export const InfoTable = ({
  onClose,
  docId,
}: {
  docId: string;
  onClose: () => void;
}) => {
  const t = useI18n();
  const { docsSearchService, workspacePropertyService, guardService } =
    useServices({
      DocsSearchService,
      WorkspacePropertyService,
      GuardService,
    });
  const canEditPropertyInfo = useLiveData(
    guardService.can$('Workspace_Properties_Update')
  );
  const canEditProperty = useLiveData(guardService.can$('Doc_Update', docId));
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);
  const properties = useLiveData(workspacePropertyService.sortedProperties$);
  const links = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsFrom(docId), null),
      [docId, docsSearchService]
    )
  );

  const backlinks = useLiveData(
    useMemo(() => {
      return LiveData.from(docsSearchService.watchRefsTo(docId), []).map(
        links => {
          const visitedDoc = new Set<string>();
          // for each doc, we only show the first block
          return links.filter(link => {
            if (visitedDoc.has(link.docId)) {
              return false;
            }
            visitedDoc.add(link.docId);
            return true;
          });
        }
      );
    }, [docId, docsSearchService])
  );

  const onBacklinkPropertyChange = useCallback(
    (_row: DatabaseRow, cell: DatabaseValueCell, _value: unknown) => {
      track.$.docInfoPanel.databaseProperty.editProperty({
        type: cell.property.type$.value,
      });
    },
    []
  );

  const onPropertyAdded = useCallback((property: DocCustomPropertyInfo) => {
    setNewPropertyId(property.id);
    track.$.docInfoPanel.property.addProperty({
      type: property.type,
      control: 'at menu',
    });
  }, []);

  const onPropertyChange = useCallback(
    (property: DocCustomPropertyInfo, _value: unknown) => {
      track.$.docInfoPanel.property.editProperty({
        type: property.type,
      });
    },
    []
  );

  const onPropertyInfoChange = useCallback(
    (
      property: DocCustomPropertyInfo,
      field: keyof DocCustomPropertyInfo,
      _value: string
    ) => {
      track.$.docInfoPanel.property.editPropertyMeta({
        type: property.type,
        field,
      });
    },
    []
  );

  return (
    <>
      <PropertyCollapsibleSection
        title={t.t('com.yunke.workspace.properties')}
      >
        <PropertyCollapsibleContent
          className={styles.tableBodyRoot}
          collapseButtonText={({ hide, isCollapsed }) =>
            isCollapsed
              ? hide === 1
                ? t['com.yunke.page-properties.more-property.one']({
                    count: hide.toString(),
                  })
                : t['com.yunke.page-properties.more-property.more']({
                    count: hide.toString(),
                  })
              : hide === 1
                ? t['com.yunke.page-properties.hide-property.one']({
                    count: hide.toString(),
                  })
                : t['com.yunke.page-properties.hide-property.more']({
                    count: hide.toString(),
                  })
          }
        >
          {properties.map(property => (
            <WorkspacePropertyRow
              key={property.id}
              propertyInfo={property}
              readonly={!canEditProperty}
              propertyInfoReadonly={!canEditPropertyInfo}
              defaultOpenEditMenu={newPropertyId === property.id}
              onChange={value => onPropertyChange(property, value)}
              onPropertyInfoChange={(...args) =>
                onPropertyInfoChange(property, ...args)
              }
            />
          ))}
          {!canEditPropertyInfo ? (
            <Button
              disabled
              variant="plain"
              prefix={<PlusIcon />}
              className={styles.addPropertyButton}
            >
              {t['com.yunke.page-properties.add-property']()}
            </Button>
          ) : (
            <Menu
              items={<CreatePropertyMenuItems onCreated={onPropertyAdded} />}
              contentOptions={{
                onClick(e) {
                  e.stopPropagation();
                },
              }}
            >
              <Button
                variant="plain"
                prefix={<PlusIcon />}
                className={styles.addPropertyButton}
              >
                {t['com.yunke.page-properties.add-property']()}
              </Button>
            </Menu>
          )}
        </PropertyCollapsibleContent>
      </PropertyCollapsibleSection>
      <Divider size="thinner" />
      <DocDatabaseBacklinkInfo onChange={onBacklinkPropertyChange} />
      {backlinks && backlinks.length > 0 ? (
        <>
          <LinksRow
            count={backlinks.length}
            references={<BacklinkGroups />}
            onClick={onClose}
            label={t['com.yunke.page-properties.backlinks']()}
          />
          <Divider size="thinner" />
        </>
      ) : null}
      {links && links.length > 0 ? (
        <>
          <LinksRow
            count={links.length}
            references={links}
            onClick={onClose}
            label={t['com.yunke.page-properties.outgoing-links']()}
          />
          <Divider size="thinner" />
        </>
      ) : null}
    </>
  );
};
