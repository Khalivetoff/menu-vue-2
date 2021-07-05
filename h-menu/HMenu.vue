<template>
  <div class="h-menu">
    <div
        ref="activator"
        class="h-menu__activator-wrapper"
        @mouseover="onActivatorHover"
        @mouseleave="onActivatorLeave"
        @click="onActivatorClick"
    >
      <slot name="activator"></slot>
    </div>
    <transition name="h-menu--transition">
      <div
          v-show="internalValue"
          ref="content"
          class="h-menu__content-wrapper"
          :style="styles"
      >
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import listenerBuilder from '../../../additional/ListenerBuilder';
import freeZIndexGetter from '../../../additional/FreeZIndexGetter';

const SidesDirection = {
  vertical: ['top', 'bottom'],
  horizontal: ['left', 'right'],
};

const SidesMirrors = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom',
};

const SidesSymbolValidation = {
  more: ['bottom', 'right'],
  less: ['top', 'left'],
};

const EmptyCoords = {
  top: '',
  right: '',
  bottom: '',
  left: '',
};

const StartZIndex = 500;

@Component
class HMenu extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  value;

  @Prop({
    type: Boolean,
    default: false,
  })
  activateOnHover;

  @Prop({
    type: Boolean,
    default: false,
  })
  closeOnContentClick;

  @Prop({
    type: Boolean,
    default: false,
  })
  persistent;

  @Prop({
    type: String,
    default: '',
  })
  width;

  @Prop({
    type: String,
    default: 'bottom',
    validator(value) {
      return value.split(' ').every(side => (side in EmptyCoords));
    },
  })
  sides;

  @Prop({
    type: Boolean,
    default: false,
  })
  activatorIsVisible;

  @Prop({
    type: Boolean,
    default: false,
  })
  disableActivator;

  internalValue = false;

  coords = { ...EmptyCoords };

  zIndex = '';

  @Watch('internalValue')
  onInternalValueChange(val) {
    this.$emit('input', val);
  }

  @Watch('value')
  onValueChange(val) {
    val ? this.open() : this.close();
  }

  @Watch('persistent')
  onPersistentChange(val) {
    !val ? this.addListeners() : this.removeListeners();
  }

  @Watch('closeOnContentClick')
  onCloseOnContentClickChange() {
    this.addListeners();
  }

  @Watch('disableActivator')
  onDisableActivatorChange() {
    this.addListeners();
  }

  close() {
    this.internalValue = false;
    this.$nextTick(() => {
      setTimeout(() => {
        this.zIndex = '';
      }, 200);
    });
  }

  open() {
    this.internalValue = true;
    this.$nextTick(() => {
      this.correctZIndex();
      this.setPosition();
    });
  }

  get internalSides() {
    const sides = {};
    this.sides.split(' ').forEach(side => sides[side] = side);
    return sides;
  }

  /**
   * TODO: вынести это отсюда в отдельный файл, чтобы попользовать эту логику в тултипах
   * */
  setPosition() {
    const coords = { ...EmptyCoords };
    const { content } = this.$refs;
    const activator = this.$refs.activator.children[0];
    const activatorBoundingClient = activator.getBoundingClientRect();
    const contentBoundingClient = content.getBoundingClientRect();
    const { innerHeight, innerWidth } = window;
    content.style.maxHeight = `${innerHeight}px`;
    content.style.maxWidth = `${innerWidth}px`;

    function correctSideValue(side) {
      const _contentBoundingClient = content.getBoundingClientRect();
      if ((SidesSymbolValidation.more.includes(side) && _contentBoundingClient[side] > (side === 'right' ? innerWidth : innerHeight))
          || (SidesSymbolValidation.less.includes(side) && _contentBoundingClient[side] < 0)) {
        coords[side] = 0;
        coords[SidesMirrors[side]] = '';
      }
    }

    if (SidesDirection.vertical.some(side => side in this.internalSides)) {
      coords.top = activatorBoundingClient.top + ('bottom' in this.internalSides ? activatorBoundingClient.height : (-contentBoundingClient.height));
      if (!this.activatorIsVisible) {
        coords.top += ('top' in this.internalSides ? activatorBoundingClient.height : (-activatorBoundingClient.height));
      }
    }

    if (SidesDirection.horizontal.some(side => side in this.internalSides)) {
      coords.left = activatorBoundingClient.left + ('left' in this.internalSides ? (-contentBoundingClient.width) : activatorBoundingClient.width);
      if (!this.activatorIsVisible) {
        coords.left += ('left' in this.internalSides ? activatorBoundingClient.width : (-activatorBoundingClient.width));
      }
    }

    if (coords.left === '') coords.left = activatorBoundingClient.left + activatorBoundingClient.width / 2 - contentBoundingClient.width / 2;
    if (coords.top === '') coords.top = activatorBoundingClient.top + activatorBoundingClient.height / 2 - contentBoundingClient.height / 2;

    this.setCoords(coords);
    this.$nextTick(() => {
      Object.keys(EmptyCoords).forEach(side => {
        correctSideValue(side);
      });
      this.setCoords(coords);
    });
  }

  setCoords(coords) {
    const _coords = { ...EmptyCoords };
    Object.keys(coords).forEach(cKey => coords[cKey] !== '' && (_coords[cKey] = `${coords[cKey]}px`));
    this.coords = { ..._coords };
  }

  correctZIndex() {
    this.zIndex = freeZIndexGetter('.h-menu__content-wrapper', StartZIndex);
  }

  onActivatorHover() {
    (!this.disableActivator && this.activateOnHover && !this.internalValue ) && this.open();
  }

  onActivatorLeave() {
    (!this.disableActivator && this.activateOnHover && this.internalValue) && this.close();
  }

  onActivatorClick() {
    (!this.disableActivator && !this.activateOnHover && !this.internalValue) && this.open();
  }

  addListeners() {
    this.removeListeners();
    if (this.disableActivator) return;
    const restrictedAreas = [this.$refs.activator];
    if (!this.closeOnContentClick) restrictedAreas.push(this.$refs.content);
    function checkClick(path) {
      return !restrictedAreas.some(el => path.includes(el));
    }
    listenerBuilder.addListener('mousedown', this.$refs.activator, (e) => {
      (this.internalValue && checkClick(e.composedPath())) && this.close();
    });
    listenerBuilder.addListener('vueClick', this.$refs.activator, (e) => {
      (this.internalValue && checkClick(e.composedPath())) && this.close();
    });
  }

  removeListeners() {
    listenerBuilder.removeListener('mousedown', this.$refs.activator);
    listenerBuilder.removeListener('vueClick', this.$refs.activator);
  }

  mounted() {
    !this.persistent && this.addListeners();
  }

  beforeDestroy() {
    this.removeListeners();
  }

  get styles() {
    return {
      width: this.width || 'auto',
      zIndex: this.zIndex,
      ...this.coords,
    };
  }
}

export default HMenu;
</script>
