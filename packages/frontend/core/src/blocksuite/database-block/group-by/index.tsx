import { Avatar, uniReactRoot } from '@yunke/component';
import {
  createGroupByConfig,
  type GroupRenderProps,
  t,
  ungroups,
} from '@blocksuite/yunke/blocks/database';
import type { UserService } from '@blocksuite/yunke-shared/services';

import { useMemberInfo } from '../hooks/use-member-info';
import {
  avatar,
  memberName,
  memberPreviewContainer,
} from '../properties/member/style.css';

const MemberPreview = ({
  memberId,
  userService,
}: {
  memberId: string;
  userService: UserService | null | undefined;
}) => {
  const userInfo = useMemberInfo(memberId, userService);
  if (!userInfo) {
    return null;
  }
  return (
    <div className={memberPreviewContainer}>
      <Avatar
        name={userInfo.removed ? undefined : (userInfo.name ?? undefined)}
        className={avatar}
        url={!userInfo.removed ? userInfo.avatar : undefined}
        size={20}
      />
      <div className={memberName}>
        {userInfo.removed ? '已删除用户' : userInfo.name || '未命名'}
      </div>
    </div>
  );
};
const MemberGroupView = (props: GroupRenderProps<string | null, {}>) => {
  const tType = props.group.tType;
  if (!t.user.is(tType)) return '未分组';
  const memberId = props.group.value;
  if (memberId == null) return '未分组';

  return (
    <MemberPreview
      memberId={memberId}
      userService={tType.data?.userService}
    ></MemberPreview>
  );
};

const MultiMemberGroupView = (props: GroupRenderProps<string | null, {}>) => {
  const tType = props.group.tType;
  if (!t.array.is(tType) || !t.user.is(tType.element)) return '未分组';
  const memberId = props.group.value;
  if (memberId == null) return '未分组';

  return (
    <MemberPreview
      memberId={memberId}
      userService={tType.element.data?.userService}
    ></MemberPreview>
  );
};

export const groupByConfigList = [
  createGroupByConfig({
    name: 'member',
    matchType: t.user.instance(),
    groupName: (type, value: string | null) => {
      if (t.user.is(type) && typeof value === 'string') {
        const userService = type.data?.userService;
        if (userService) {
          const userInfo = userService.userInfo$(value).value;
          if (userInfo && !userInfo?.removed) {
            return userInfo.name ?? '未命名';
          }
        }
      }
      return '';
    },
    defaultKeys: () => {
      return [ungroups];
    },
    valuesGroup: value => {
      if (typeof value !== 'string') {
        return [ungroups];
      }
      return [
        {
          key: value,
          value: value,
        },
      ];
    },
    addToGroup: v => v,
    view: uniReactRoot.createUniComponent(MemberGroupView),
  }),
  createGroupByConfig({
    name: 'multi-member',
    matchType: t.array.instance(t.user.instance()),
    groupName: (_type, value: string | null) => {
      if (
        t.array.is(_type) &&
        t.user.is(_type.element) &&
        typeof value === 'string'
      ) {
        const userService = _type.element.data?.userService;
        if (userService) {
          const userInfo = userService.userInfo$(value).value;
          if (userInfo && !userInfo?.removed) {
            return userInfo.name ?? '未命名';
          }
        }
      }
      return '';
    },
    defaultKeys: _type => {
      return [ungroups];
    },
    valuesGroup: (value, _type) => {
      if (!Array.isArray(value) || value.length === 0) {
        return [ungroups];
      }
      return value.map(id => ({
        key: id,
        value: id,
      }));
    },
    addToGroup: (value, old) => {
      if (value == null) {
        return old;
      }
      return Array.isArray(old) ? [...old, value] : [value];
    },
    removeFromGroup: (value, old) => {
      if (Array.isArray(old)) {
        return old.filter(v => v !== value);
      }
      return old;
    },
    view: uniReactRoot.createUniComponent(MultiMemberGroupView),
  }),
];
