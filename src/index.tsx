import React, {Component, ReactChild, ReactNode} from 'react';
import OriginalWinBox from 'winbox/src/js/winbox';
import {createRoot, Root} from 'react-dom/client';

type WinBoxPropType = {
  title: string
  id?: string
  children?: ReactChild | Iterable<ReactNode> | null
  /**
   * When you use this, the children elements will be ignored.
   */
  url?: string

  noAnimation?: boolean,
  noShadow?: boolean,
  noHeader?: boolean,
  noMin?: boolean,
  noMax?: boolean,
  noFull?: boolean,
  noClose?: boolean,
  noResize?: boolean,
  noMove?: boolean,
  modal?: boolean,
  hide?: boolean,

  index?: number,
  border?: number,
  splitscreen?: boolean,
  background?: string,

  max?: boolean,
  min?: boolean,

  x?: string | number | 'center',
  y?: string | number | 'center',
  top?: string | number,
  bottom?: string | number,
  left?: string | number,
  right?: string | number,
  height?: string | number,
  width?: string | number,
  fullscreen?: boolean,

  /**
   * see the following document for more detail about the argument and the return value.
   * @see https://github.com/nextapps-de/winbox
   * @param force whether you should not abort the winbox to close.
   * @return canBeClosed - true if the winbox can be closed
   */
  onclose?: (force?: boolean) => boolean,
  onmove?: (x: number, y: number) => any,
  onresize?: (width: number, height: number) => any,
  onblur?: () => any,
  onfocus?: () => any,

  className?: string | number,
}

type WinBoxState = {
  closed: boolean
}

/**
 * # WinBox React Component
 *
 * Use refs to call focus(), isMax(), isMin(), getId(), isClosed() methods if need. But for others, use props instead of refs.
 * @see https://github.com/rickonono3/react-winbox
 * @see https://github.com/nextapps-de/winbox
 */
class WinBox extends Component<WinBoxPropType, WinBoxState> {
  public winBoxObj: OriginalWinBox;

  private reactRoot: Root | undefined;

  private reactRootTarget: unknown;

  constructor(props) {
    super(props);
    this.state = {
      closed: false,
    };
    this.reactRoot = undefined;
    this.reactRootTarget = undefined;
    this.winBoxObj = undefined;
  }

  componentDidMount() {
    try {
      if (this.props.id !== undefined && this.props.id !== null && document.getElementById(this.props.id))
        throw 'duplicated window id';
      this.winBoxObj = new OriginalWinBox({
        width: 300,
        height: 200,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        ...this.props,
        class: `${this.props.className ?? ''}`,
        onClose: () => {
          if (this.props.onclose?.() ?? true) { // the default is true
            this.handleClose(); // only when ture, do close process.
            return true;
          }
          return false;
        },
      });
      this.renderChildren();
      this.maintainStyle();
    } catch (e) {
      console.error(e);
      this.winBoxObj?.close(true);
      this.setState({closed: true});
    }
  }

  componentDidUpdate(prevProps: Readonly<WinBoxPropType>, prevState: Readonly<WinBoxState>) {
    this.maintain({prevProps});
  }

  componentWillUnmount() {
    this.winBoxObj?.close(true);
  }

  public forceUpdate(callback?: () => void): void {
    try {
      this.maintain({force: true});
    } catch (e) {
      console.error(e);
      this.winBoxObj?.close(true);
      this.setState({closed: true});
    }

    super.forceUpdate(callback);
  }

  public focus = (): void => (this.winBoxObj?.focus());

  public getId = (): string | undefined => (this.winBoxObj?.id);

  public isMax = (): boolean => (this.winBoxObj?.max ?? false);

  public isMin = (): boolean => (this.winBoxObj?.min ?? false);

  public isClosed = (): boolean => (this.state.closed);

  renderChildren = () => {
    if (!this.winBoxObj) return; // because of twice calling in the strictMode, there can't be a `!this.state.closed`
    if (Object.keys(this.props).indexOf('url') !== -1 && this.props.url)
      return; // do nothing if url is set.
    if (!this.reactRoot || this.reactRootTarget !== this.winBoxObj.body) {
      // this.reactRoot = hydrateRoot(this.winBoxObj.body, this.props.children);
      this.reactRootTarget = this.winBoxObj.body;
      this.reactRoot = createRoot(this.winBoxObj.body);
    }
    if (this.props.children) {
      this.reactRoot.render(this.props.children);
    }
  };

  maintainStyle = () => {
    if (!this.winBoxObj) return;
    this.winBoxObj[this.props.noAnimation ? 'addClass' : 'removeClass']('no-animation');
    this.winBoxObj[this.props.noClose ? 'addClass' : 'removeClass']('no-close');
    this.winBoxObj[this.props.noFull ? 'addClass' : 'removeClass']('no-full');
    this.winBoxObj[this.props.noMin ? 'addClass' : 'removeClass']('no-min');
    this.winBoxObj[this.props.noMax ? 'addClass' : 'removeClass']('no-max');
    this.winBoxObj[this.props.noMove ? 'addClass' : 'removeClass']('no-move');
    this.winBoxObj[this.props.noHeader ? 'addClass' : 'removeClass']('no-header');
    this.winBoxObj[this.props.noResize ? 'addClass' : 'removeClass']('no-resize');
    this.winBoxObj[this.props.noShadow ? 'addClass' : 'removeClass']('no-shadow');
    this.winBoxObj[this.props.modal ? 'addClass' : 'removeClass']('modal');
    this.winBoxObj[this.props.hide ? 'addClass' : 'removeClass']('hide');
  };

  maintain = (args ?: { force?: boolean, prevProps?: WinBoxPropType }) => {
    if (!this.winBoxObj) return;
    const {force, prevProps} = args ?? {};
    if (force || prevProps?.title !== this.props.title) {
      this.winBoxObj?.setTitle(this.props.title);
    }
    if (force || prevProps?.fullscreen !== this.props.fullscreen) {
      this.winBoxObj?.fullscreen(this.props.fullscreen);
    }
    if (force || prevProps?.min !== this.props.min) {
      this.winBoxObj?.minimize(this.props.min);
    }
    if (force || prevProps?.max !== this.props.max) {
      this.winBoxObj?.maximize(this.props.max);
    }
    if (force
      || prevProps?.width !== this.props.width
      || prevProps?.height !== this.props.height
    ) {
      const width = this.props.width ?? this.winBoxObj.width;
      const height = this.props.height ?? this.winBoxObj.height;
      // use function params rather than assigning fields directly to avoid the 'just support numbers' feature
      // see https://github.com/nextapps-de/winbox#custom-position--size
      this.winBoxObj?.resize(width, height);
    }
    if (force
      || prevProps?.x !== this.props.x
      || prevProps?.y !== this.props.y
    ) {
      const x = this.props.x ?? this.winBoxObj.x;
      const y = this.props.y ?? this.winBoxObj.y;
      // use function params rather than assigning fields directly to avoid the 'just support numbers' feature
      // see https://github.com/nextapps-de/winbox#custom-position--size
      this.winBoxObj?.move(x, y);
    }
    if (force
      || prevProps?.top !== this.props.top
      || prevProps?.right !== this.props.right
      || prevProps?.bottom !== this.props.bottom
      || prevProps?.left !== this.props.left
    ) {
      this.winBoxObj.top = this.props.top ?? this.winBoxObj.top;
      this.winBoxObj.right = this.props.right ?? this.winBoxObj.right;
      this.winBoxObj.bottom = this.props.bottom ?? this.winBoxObj.bottom;
      this.winBoxObj.left = this.props.left ?? this.winBoxObj.left;
      this.winBoxObj?.move();
    }
    if (force || prevProps?.url !== this.props.url) {
      this.winBoxObj?.setUrl(this.props.url);
    }
    this.renderChildren();
    this.maintainStyle();
  };

  handleClose = () => {
    this.reactRoot = undefined;
    this.reactRootTarget = undefined;
    this.setState({closed: true});
  };

  render() {
    return (
      <div data-closed={this.state.closed}/>
    );
  }
}

export default WinBox;
