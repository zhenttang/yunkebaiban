import { NavigationPanelTreeRoot } from '@yunke/core/desktop/components/navigation-panel';
import { NavigationPanelService } from '@yunke/core/modules/navigation-panel';
import { TagService } from '@yunke/core/modules/tag';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { AddTagIcon } from '@blocksuite/icons/rc';
import { useLiveData, useServices } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { AddItemPlaceholder } from '../../layouts/add-item-placeholder';
import { CollapsibleSection } from '../../layouts/collapsible-section';
import { NavigationPanelTagNode } from '../../nodes/tag';
import { TagRenameDialog } from '../../nodes/tag/dialog';

export const TagDesc = ({ input }: { input: string }) => {
  const t = useI18n();

  return input
    ? t['com.yunke.m.explorer.tag.new-tip-not-empty']({ value: input })
    : t['com.yunke.m.explorer.tag.new-tip-empty']();
};

export const NavigationPanelTags = () => {
  const { tagService, navigationPanelService } = useServices({
    TagService,
    NavigationPanelService,
  });
  const navigationPanelSection = navigationPanelService.sections.tags;
  const tags = useLiveData(tagService.tagList.tags$);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);

  const t = useI18n();

  const handleNewTag = useCallback(
    (name: string, color: string) => {
      setShowNewTagDialog(false);
      tagService.tagList.createTag(name, color);
      track.$.navigationPanel.organize.createOrganizeItem({ type: 'tag' });
      navigationPanelSection.setCollapsed(false);
    },
    [navigationPanelSection, tagService]
  );

  return (
    <CollapsibleSection
      name="tags"
      title={t['com.yunke.rootAppSidebar.tags']()}
    >
      <NavigationPanelTreeRoot>
        {tags.map(tag => (
          <NavigationPanelTagNode key={tag.id} tagId={tag.id} />
        ))}
        <AddItemPlaceholder
          icon={<AddTagIcon />}
          data-testid="navigation-panel-add-tag-button"
          onClick={() => setShowNewTagDialog(true)}
          label={t[
            'com.yunke.rootAppSidebar.explorer.tag-section-add-tooltip'
          ]()}
        />
        <TagRenameDialog
          open={showNewTagDialog}
          onOpenChange={setShowNewTagDialog}
          onConfirm={handleNewTag}
          enableAnimation
          descRenderer={TagDesc}
        />
      </NavigationPanelTreeRoot>
    </CollapsibleSection>
  );
};
