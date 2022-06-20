portalApp
  .factory('photoAlbum', photoAlbum)
  .directive('photoGallery', photoGallery)
  .directive('photoGalleryAlbumsCarousel', photoGalleryAlbumsCarousel)
  .directive('photoGalleryPhotosCarousel', photoGalleryPhotosCarousel)
  .directive('imgLoad', imgLoad)
  ;


// фабрика для работы с Фотоальбомами
photoAlbum.$inject = ['$http', '$q'];
function photoAlbum($http, $q) {
  var obj = {
    /*
      получить альбом
      unid?: string - unid альбома
      если не передан unid, то получаем все альбомы
    */
    getPhotoAlbum: function (albumUnid) {
      var deferred = $q.defer();
      albumUnid = albumUnid || 'all';

      $http({
        method: 'GET',
        url: '/api/photoAlbum/get/' + albumUnid
      }).then(function (response) {
        if (angular.isObject(response) &&
          angular.isObject(response.data) &&
          response.data.success === true) {
          deferred.resolve(response.data);
        }
        else {
          deferred.reject(response.data.message);
        }
      }, function (reason) {
        deferred.reject(reason);
      });

      return deferred.promise;
    },

    // создать альбом
    createPhotoAlbum: function (album) {
      var deferred = $q.defer();

      $http({
        method: 'POST',
        url: '/api/photoAlbum/create',
        data: album
      }).then(function (response) {
        if (angular.isObject(response) &&
          angular.isObject(response.data) &&
          response.data.success === true) {
          deferred.resolve(response.data);
        }
        else {
          deferred.reject(response.data.message);
        }
      }, function (reason) {
        deferred.reject(reason);
      });

      return deferred.promise;
    },

    // редактировать альбом
    editPhotoAlbum: function (album) {
      var deferred = $q.defer();

      $http({
        method: 'POST',
        url: '/api/photoAlbum/edit/' + album.unid,
        data: album
      }).then(function (response) {
        if (angular.isObject(response) &&
          angular.isObject(response.data) &&
          response.data.success === true) {
          deferred.resolve(response.data);
        }
        else {
          deferred.reject(response.data.message);
        }
      }, function (reason) {
        deferred.reject(reason);
      });

      return deferred.promise;
    },

    // удалить альбом
    removePhotoAlbum: function (albumUnid) {
      var deferred = $q.defer();

      $http({
        method: 'POST',
        url: '/api/photoAlbum/remove/' + albumUnid,
        data: {}
      }).then(function (response) {
        if (angular.isObject(response) &&
          angular.isObject(response.data) &&
          response.data.success === true) {
          deferred.resolve(response.data);
        }
        else {
          deferred.reject(response.data.message);
        }
      }, function (reason) {
        deferred.reject(reason);
      });

      return deferred.promise;
    }

  }

  return obj;
}



// блок Фото-галлерея для Главной
photoGallery.$inject = [];
function photoGallery() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: "/bundles/tretoportal/partials/index/common/photo-gallery/photo-gallery.html",
    controller: photoGalleryCtrl,
    link: function (scope, element, attrs, ctrl) {
      scope.ctrl = ctrl;
      scope.albums = [];
      scope.activeAlbumNumber = 0;
      scope.loading = true;
      scope.oneAlbum = 'oneAlbum' in attrs;


      // получить массив альбомов
      scope.ctrl.getAlbumList();
    }
  };
}

// контроллер директивы photoGallery
photoGalleryCtrl.$inject = ['$scope', '$rootScope', '$mdPanel', 'photoAlbum', '$translate', 'Popup'];
function photoGalleryCtrl($scope, $rootScope, $mdPanel, photoAlbum, $translate, Popup) {
  this._$scope = $scope;
  this._$rootScope = $rootScope;
  this._$mdPanel = $mdPanel;
  this._photoAlbum = photoAlbum;
  this._$translate = $translate;
  this._Popup = Popup;

  this._mdPanelRef = null;
  this._panelListener = null;
  this._panelPosition = null;
}
// получить список альбомов
photoGalleryCtrl.prototype.getAlbumList = function () {
  var self = this;
  var Popup = this._Popup;

  this._$scope.loading = true;

  this._photoAlbum.getPhotoAlbum()
    .then(function (response) {
      self._$scope.albums = self._$scope.oneAlbum ? response.albums.slice(-1) : response.albums;
      self._$scope.loading = false;
    })
    .catch(function (reason) {
      var _title = self._$translate.instant('Popup.head_ei.error');

      self._$scope.loading = false;

      new Popup(_title, reason, 'error', false,
        function () { }, function () { }, { 'ok': $translate.instant('Popup.btn_ok') });
    });
}
// предыдущий альбом
photoGalleryCtrl.prototype.prevAlbum = function () {
  var prevNumber = this._$scope.activeAlbumNumber - 1;
  this._$scope.activeAlbumNumber = prevNumber < 0
    ? this._$scope.albums.length - 1
    : prevNumber;

  this._$scope.$broadcast('prevAlbumSelectedEvent', {
    prevNumber: prevNumber,
    activeAlbumNumber: this._$scope.activeAlbumNumber
  });
}
// следующий альбом
photoGalleryCtrl.prototype.nextAlbum = function () {
  var nextNumber = this._$scope.activeAlbumNumber + 1;
  this._$scope.activeAlbumNumber = nextNumber > (this._$scope.albums.length - 1)
    ? 0
    : nextNumber;

  this._$scope.$broadcast('nextAlbumSelectedEvent', {
    nextNumber: nextNumber,
    activeAlbumNumber: this._$scope.activeAlbumNumber
  });
}
//  открыть панель Создать альбом
photoGalleryCtrl.prototype.showCreateAlbumPanel = function (event) {
  var _parentSelector = event.target;
  this._mdPanelRef = this._createAlbumPanel(_parentSelector, 'create');
  this._mdPanelRef.open();
}
//  открыть панель Редактировать альбом
photoGalleryCtrl.prototype.showEditAlbumPanel = function () {
  var MORE_MENU_SELECTOR = '.photo-gallery-content_album-more-menu';
  var _parentSelector = document.querySelector(MORE_MENU_SELECTOR);

  this._mdPanelRef = this._createAlbumPanel(_parentSelector, 'edit');
  this._mdPanelRef.open();
}
// создать альбом
photoGalleryCtrl.prototype.createPhotoAlbum = function (album) {
  var self = this;
  var Popup = this._Popup;

  if (!album) {
    return;
  }

  this._$scope.loading = true;

  this._photoAlbum.createPhotoAlbum(album)
    .then(function (response) {
      if (self._$scope.oneAlbum) self._$scope.albums = [response.newAlbum];
      else self._$scope.albums.push(response.newAlbum);
      self._$scope.activeAlbumNumber = self._$scope.oneAlbum ? 0 : self._$scope.albums.length - 1;

      self._$scope.$broadcast('changeAlbumEvent', {
        activeNumber: self._$scope.activeAlbumNumber
      });

      self._$scope.loading = false;
    })
    .catch(function (reason) {
      var _title = self._$translate.instant('Popup.head_ei.error');

      new Popup(_title, reason, 'error', false,
        function () { }, function () { }, { 'ok': self._$translate.instant('Popup.btn_ok') });

      self._$scope.loading = false;
    });
}
// редактировать альбом
photoGalleryCtrl.prototype.editPhotoAlbum = function (album) {
  var self = this;
  var Popup = this._Popup;

  if (!album) {
    return;
  }

  this._$scope.loading = true;

  this._photoAlbum.editPhotoAlbum(album)
    .then(function (response) {
      _.extend(_.findWhere(self._$scope.albums, { unid: response.editedAlbum.unid }), response.editedAlbum);

      self._$scope.loading = false;
    })
    .catch(function (reason) {
      var _title = self._$translate.instant('Popup.head_ei.error');

      new Popup(_title, reason, 'error', false,
        function () { }, function () { }, { 'ok': self._$translate.instant('Popup.btn_ok') });

      self._$scope.loading = false;
    });
}
// удалить альбом
photoGalleryCtrl.prototype.removePhotoAlbum = function () {
  var self = this;
  var Popup = this._Popup;
  var deletedAlbum = this._$scope.albums[this._$scope.activeAlbumNumber];
  var title = this._$translate.instant('Popup.title.notice');
  var message = this._$translate.instant('Popup.photoGallery.deletedAlbum.message', { deletedAlbum: deletedAlbum.subject });

  new Popup(title, message, '', true,
    function () { // onOk
      self._$scope.loading = true;

      self._photoAlbum.removePhotoAlbum(deletedAlbum.unid)
        .then(function (response) {
          if (self._$scope.oneAlbum) self._$scope.ctrl.getAlbumList();
          else self._$scope.albums = _.without(self._$scope.albums, _.findWhere(self._$scope.albums, { unid: deletedAlbum.unid }));
          self._$scope.activeAlbumNumber = 0;

          self._$scope.$broadcast('changeAlbumEvent', {
            activeNumber: self._$scope.activeAlbumNumber
          });

          self._$scope.loading = false;
        })
        .catch(function (reason) {
          var _title = self._$translate.instant('Popup.head_ei.error');

          new Popup(_title, reason, 'error', false,
            function () { }, function () { }, { 'ok': self._$translate.instant('Popup.btn_ok') });

          self._$scope.loading = false;
        });
    },
    function () { }
  );
}
/*
  создать панель Создать/редактировать альбом
  act: string - 'create'/'edit'
*/
photoGalleryCtrl.prototype._createAlbumPanel = function (parentSelector, act) {
  var self = this;
  var selectedAlbum = (act === 'edit')
    ? this._$scope.albums[this._$scope.activeAlbumNumber]
    : {};

  this._panelPosition = this._$mdPanel.newPanelPosition()
    .relativeTo(parentSelector)
    .addPanelPosition(this._$mdPanel.xPosition.CENTER, this._$mdPanel.yPosition.ALIGN_TOPS);

  var config = {
    attachTo: angular.element(document.body),
    position: this._panelPosition,
    controller: CreateAlbumPanelCtrl,
    controllerAs: 'createAlbumCtrl',
    templateUrl: '/bundles/tretoportal/partials/index/common/photo-gallery/create-album-panel.html',
    hasBackdrop: false,
    panelClass: 'create-album-panel',
    trapFocus: true,
    zIndex: 50,
    clickOutsideToClose: true,
    escapeToClose: true,
    focusOnOpen: true,
    locals: {
      photogalleryCtrl: this,
      act: act,
      _album: selectedAlbum
    },
    onOpenComplete: function () {
      self._initPanel();
    },
    onDomRemoved: function () {
      self._removePanel();
    }
  };

  return this._$mdPanel.create(config);
}
// инициализация панели
photoGalleryCtrl.prototype._initPanel = function () {
  var MIN_DIFF_HEIGHT = 40;
  var TABLET_SCREEN = 768;
  var self = this;

  if (this._$rootScope.screenWidth >= TABLET_SCREEN) {
    this._panelListener = this._$scope.$watch(
      function () {
        return self._mdPanelRef.panelEl[0].offsetHeight;
      },
      function (newValue, oldValue) {
        var diff = newValue - oldValue;

        if (diff > MIN_DIFF_HEIGHT || diff < -MIN_DIFF_HEIGHT) {
          self._updatePosition();
        }
      },
      true);
  }
}
// скрытие панели
photoGalleryCtrl.prototype._removePanel = function () {
  // уничтожить this._panelListener
  if (this._panelListener && _.isFunction(this._panelListener)) {
    this._panelListener();
  }
}
// обновить позицию панели
photoGalleryCtrl.prototype._updatePosition = function () {
  if (this._mdPanelRef) {
    this._mdPanelRef.updatePosition(this._panelPosition);
  }
}

// контроллер панели Создать/редактировать альбом
function CreateAlbumPanelCtrl(mdPanelRef, photogalleryCtrl, act, _album, GUID, $rootScope, $translate, Popup) {
  var self = this;
  var MAX_PHOTO_IN_ALBUM = 5;
  var _popupTitle = $translate.instant('Popup.title.notice');

  self.photogalleryCtrl = photogalleryCtrl;

  // создаем/редактируем альбом
  self.act = act;

  // альбом
  self.album = (act === 'create')
    ? {
      unid: GUID(),
      subject: null,
      attachments: null,
      authorLogin: $rootScope.user.username
    }
    : angular.copy(_album);

  // заголовок панели
  self.panelTitle = (act === 'create')
    ? $translate.instant('photogallery.panelTitle.create')
    : $translate.instant('photogallery.panelTitle.edit');



  // сохранить
  self.save = function () {
    if (self.panelForm.$valid && !$rootScope.uploader.isUploading) {

      // если нет фотографий
      if (
        !self.album.attachments ||
        (self.album.attachments && self.album.attachments.length === 0)
      ) {
        var _message = $translate.instant('Popup.photoGallery.need_attach.message');

        new Popup(_popupTitle, _message, 'error', false,
          function () { }, function () { }, { 'ok': $translate.instant('Popup.btn_ok') });

        return;
      }

      // если фотографий больше максимального количества
      if (self.album.attachments && self.album.attachments.length > MAX_PHOTO_IN_ALBUM) {
        var _message = $translate.instant('Popup.photoGallery.max-attach.message');

        new Popup(_popupTitle, _message, 'error', false,
          function () { }, function () { }, { 'ok': $translate.instant('Popup.btn_ok') });

        return;
      }

      _saveAlbum();
    }
  }

  // закрыть окно
  self.cancel = function () {
    mdPanelRef && mdPanelRef.close();
  }



  // сохранить альбом
  function _saveAlbum() {
    mdPanelRef && mdPanelRef.close()
      .then(function () {
        switch (self.act) {
          case 'create':
            self.photogalleryCtrl.createPhotoAlbum(self.album);
            break;

          case 'edit':
            self.photogalleryCtrl.editPhotoAlbum(self.album);
            break;

          default:
            break;
        }
      })
      .catch(function (reason) {
        console.log('Couldn\'t close Create Album panel for reason: ', reason);
      });
  }
}

// карусель фотоальбомов
photoGalleryAlbumsCarousel.$inject = [];
function photoGalleryAlbumsCarousel() {
  return {
    restrict: 'A',
    link: function (scope, elem) {
      var CAROUSEL_STAGE_OUTER_ELEMENT_SELECTOR = '.photo-gallery_albums-carousel-stage-outer';
      var CAROUSEL_STAGE_ELEMENT_SELECTOR = '.photo-gallery_albums-carousel-stage';
      var CAROUSEL_ARROWS_ELEMENT_SELECTOR = '.photo-gallery_albums-carousel-arrows';
      var CAROUSEL_ITEM_ELEMENT_SELECTOR = '.photo-gallery_albums-carousel-item';

      var CAROUSEL_ACTIVE_CLASS_NAME = 'carousel-active';

      var carouselStageOuterListener = null;
      var prevAlbumSelectedListener = null;
      var nextAlbumSelectedListener = null;
      var changeAlbumListener = null;
      var carouselItemListener = null;

      var carouselStageOuterEl = null;
      var carouselStageEl = null;
      var carouselItemWidth = 0;
      var position = 0;


      _init();



      // листать назад (сдвиг влево)
      scope.scrollBack = function (prevNumber) {
        position += prevNumber < 0
          ? -carouselItemWidth * (scope.albums.length - 1)
          : carouselItemWidth;

        var xPos = position + 'px';
        carouselStageEl.style.transform = 'translate(' + xPos + ', 0)';
      }

      // листать вперед (сдвиг вправо)
      scope.scrollForward = function (nextNumber) {

        position += nextNumber > (scope.albums.length - 1)
          ? carouselItemWidth * (scope.albums.length - 1)
          : -carouselItemWidth;

        var xPos = position + 'px';
        carouselStageEl.style.transform = 'translate(' + xPos + ', 0)';
      }

      scope.$on('$destroy', function () {
        _unscribe();
      });



      // инициализация
      function _init() {
        _unscribe();

        // подписаться на событие "Альбом изменен (удален/добавлен)"
        changeAlbumListener = scope.$on('changeAlbumEvent', function (event, data) {
          _init();
        });

        // если альбомов больше 1, то показывать их в карусели
        if (scope.albums.length > 1) {
          carouselStageOuterListener = scope.$watch(
            function () {
              return document.querySelector(CAROUSEL_STAGE_OUTER_ELEMENT_SELECTOR).offsetWidth;
            },
            function (_width) {
              _initCarousel();
            }
          );

          // подписаться на событие "Выбран предыдущий альбом"
          prevAlbumSelectedListener = scope.$on('prevAlbumSelectedEvent', function (event, data) {
            scope.scrollBack(data.prevNumber);
          });

          // подписаться на событие "Выбран следующий альбом"
          nextAlbumSelectedListener = scope.$on('nextAlbumSelectedEvent', function (event, data) {
            scope.scrollForward(data.nextNumber);
          });

        } else {
          _destroyCarousel();
        }
      }

      // инициализация карусели
      function _initCarousel() {
        // добавить активный класс карусели
        elem[0].classList.add(CAROUSEL_ACTIVE_CLASS_NAME);
        document.querySelector(CAROUSEL_STAGE_ELEMENT_SELECTOR).classList.remove('no-carousel');
        document.querySelector(CAROUSEL_ARROWS_ELEMENT_SELECTOR).classList.remove('no-carousel');

        // carouselStageOuterEl
        carouselStageOuterEl = document.querySelector(CAROUSEL_STAGE_OUTER_ELEMENT_SELECTOR);
        carouselStageOuterRect = carouselStageOuterEl.getBoundingClientRect();

        // carouselItem
        carouselItemWidth = carouselStageOuterRect.width;

        // carouselStageEl
        carouselStageEl = document.querySelector(CAROUSEL_STAGE_ELEMENT_SELECTOR);
        // установить карусель в положение активного альбома
        position = -carouselItemWidth * scope.activeAlbumNumber;
        var xPos = position + 'px';
        carouselStageEl.style.transform = 'translate(' + xPos + ', 0)';

        /**
         * подписаться на изменение высоты содержимого альбома
         * чтобы автоматически задавать высоту альбома = высоте содержимого альбома
        */
        carouselItemListener = scope.$watch(
          function () {
            return document.querySelectorAll(CAROUSEL_ITEM_ELEMENT_SELECTOR)[scope.activeAlbumNumber].offsetHeight;
          },
          function (_height) {
            carouselStageEl.style.height = _height + 'px';
          }
        );
      }

      // удалить карусель
      function _destroyCarousel() {
        // снять активный класс карусели
        elem[0].classList.remove(CAROUSEL_ACTIVE_CLASS_NAME);
        document.querySelector(CAROUSEL_STAGE_ELEMENT_SELECTOR).classList.add('no-carousel');
        document.querySelector(CAROUSEL_ARROWS_ELEMENT_SELECTOR).classList.add('no-carousel');

        // carouselStageEl
        carouselStageEl = document.querySelector(CAROUSEL_STAGE_ELEMENT_SELECTOR);
        // вернуть карусель в первоначальное положение
        carouselStageEl.style.transform = 'translate(0, 0)';
        position = 0;
      }

      // отписаться
      function _unscribe() {

        // уничтожить carouselStageOuterListener если он не был уничтожен ранее
        if (carouselStageOuterListener && _.isFunction(carouselStageOuterListener)) {
          carouselStageOuterListener();
        }

        // уничтожить prevAlbumSelectedListener если он не был уничтожен ранее
        if (prevAlbumSelectedListener && _.isFunction(prevAlbumSelectedListener)) {
          prevAlbumSelectedListener();
        }

        // уничтожить nextAlbumSelectedListener если он не был уничтожен ранее
        if (nextAlbumSelectedListener && _.isFunction(nextAlbumSelectedListener)) {
          nextAlbumSelectedListener();
        }

        // уничтожить changeAlbumListener если он не был уничтожен ранее
        if (changeAlbumListener && _.isFunction(changeAlbumListener)) {
          changeAlbumListener();
        }

        // уничтожить carouselItemListener если он не был уничтожен ранее
        if (carouselItemListener && _.isFunction(carouselItemListener)) {
          carouselItemListener();
        }
      }

    }
  };
}

// карусель фотографий в альбоме
photoGalleryPhotosCarousel.$inject = ['$timeout', 'Environment', 'DetectSwipe'];
function photoGalleryPhotosCarousel($timeout, Environment, DetectSwipe) {
  return {
    restrict: 'E',
    scope: {
      album: '=',
      // номер активного альбома (начиная с 0)
      activeAlbumNumber: '@',
      albumIndex: '='
    },
    templateUrl: "/bundles/tretoportal/partials/index/common/photo-gallery/photo-gallery-photos-carousel.html",
    link: function (scope, elem) {
      var CAROUSEL_DELAY = 7000;
      var CAROUSEL_ACTIVE_CLASS_NAME = 'multiple';
      var CAROUSEL_TOUCH_CLASS_NAME = 'touch';
      var CAROUSEL_ITEM_ACTIVE_CLASS_NAME = 'active';
      var CAROUSEL_CONTENT_SELECTOR = '.photo-gallery_photos-carousel';
      var CAROUSEL_ITEM_SELECTOR = '.photo-gallery_photos-carousel-item';

      var prevAlbumSelectedListener = null;
      var nextAlbumSelectedListener = null;

      var myTimer = null;
      var carouselContent = null;
      var carouselItems = null;
      // номер активного слайда (начиная с 1)
      var slideIndex = 1;

      // состояние загрузки фотографий
      scope.imageLoading = [];
      scope.imageOnLoad = _imageOnLoad;


      _init(+scope.activeAlbumNumber);


      scope.$on('$destroy', function () {
        _unscribe();
      });



      function _init(activeAN) {
        var activeAlbumNumber = activeAN;

        _unscribe();

        // пока фотографии не загружены, показывать spinner
        for (var i = 0; i < scope.album.attachments.length; i++) {
          scope.imageLoading.push(true);
        }

        // если альбом сейчас на экране
        if (activeAlbumNumber === scope.albumIndex) {
          $timeout(function () {
            carouselContent = elem[0].querySelector(CAROUSEL_CONTENT_SELECTOR);
            carouselItems = elem[0].querySelectorAll(CAROUSEL_ITEM_SELECTOR);

            // если в альбоме больше 1 фотографии
            if (scope.album.attachments.length > 1) {

              // добавить активный класс карусели
              carouselContent.classList.add(CAROUSEL_ACTIVE_CLASS_NAME);

              // для сенсорных экранов
              if (Environment.device.isTouch) {
                // добавить touch класс карусели
                carouselContent.classList.add(CAROUSEL_TOUCH_CLASS_NAME);
                // подписаться на события swipe
                DetectSwipe.subscribeDetectSwipe(CAROUSEL_CONTENT_SELECTOR, _swipeAction, carouselContent);

              } else {
                // остановить/восстановить показ слайдов при hover над элементом carouselContent
                carouselContent.addEventListener('mouseenter', _pauseShowSlides);
                carouselContent.addEventListener('mouseleave', _renewShowSlides);
              }


              _showSlides(slideIndex);
              myTimer = setInterval(function () { _plusSlides(1) }, CAROUSEL_DELAY);

            } else {
              // добавить активный класс первому слайду
              carouselItems[0].classList.add(CAROUSEL_ITEM_ACTIVE_CLASS_NAME);
            }

          }, true);
        }

        // подписаться на событие "Выбран предыдущий альбом"
        prevAlbumSelectedListener = scope.$on('prevAlbumSelectedEvent', function (event, data) {
          _init(data.activeAlbumNumber);
        });
        // подписаться на событие "Выбран следующий альбом"
        nextAlbumSelectedListener = scope.$on('nextAlbumSelectedEvent', function (event, data) {
          _init(data.activeAlbumNumber);
        });

      }

      /*
        инициализация показа слайдов:
        определяет вперед или назад двигаться по слайдам
      */
      function _plusSlides(n) {
        clearInterval(myTimer);
        if (n < 0) {
          _showSlides(slideIndex -= 1);
        } else {
          _showSlides(slideIndex += 1);
        }
        if (n === -1) {
          myTimer = setInterval(function () { _plusSlides(n + 2) }, CAROUSEL_DELAY);
        } else {
          myTimer = setInterval(function () { _plusSlides(n + 1) }, CAROUSEL_DELAY);
        }
      }

      // показать активный слайд (n), остальные слайды скрыть
      function _showSlides(n) {
        var i;
        var slides = carouselItems;

        if (n > slides.length) { slideIndex = 1 }
        if (n < 1) { slideIndex = slides.length }

        // снять активный класс со всех слайдов
        for (i = 0; i < slides.length; i++) {
          slides[i].classList.remove(CAROUSEL_ITEM_ACTIVE_CLASS_NAME);
        }

        // добавить активный класс текущему слайду
        slides[slideIndex - 1].classList.add(CAROUSEL_ITEM_ACTIVE_CLASS_NAME);
      }

      // остановить показ слайдов
      function _pauseShowSlides() {
        clearInterval(myTimer);

        for (i = 0; i < carouselItems.length; i++) {
          carouselItems[i].classList.remove(CAROUSEL_ITEM_ACTIVE_CLASS_NAME);
        }
      }

      // восстановить показ слайдов
      function _renewShowSlides() {
        clearInterval(myTimer);
        myTimer = setInterval(function () { _plusSlides(slideIndex) }, CAROUSEL_DELAY);
        _showSlides(slideIndex = 1);
      }

      // показать выбранный слайд
      function _currentSlide(n) {
        clearInterval(myTimer);
        myTimer = setInterval(function () { _plusSlides(n + 1) }, CAROUSEL_DELAY);
        _showSlides(slideIndex = n);
      }

      // действия при swipe
      function _swipeAction(event, element, direction) {
        if (direction === 'left' || direction === 'right') {
          var currentIndex = (direction === 'left')
            ? slideIndex + 1
            : slideIndex - 1;

          _currentSlide(currentIndex);
        }
      }

      // фотография загружена
      function _imageOnLoad(data) {
        /*
          отметить в массиве состояний загрузки фотографию как загруженную,
          чтобы скрыть spinner и показать фотографию
        */
        scope.imageLoading.splice(data.imageIndex, 1, false);
      }

      // сделать отписки
      function _unscribe() {
        clearInterval(myTimer);

        if (carouselContent) {
          carouselContent.removeEventListener('mouseenter', _pauseShowSlides);
          carouselContent.removeEventListener('mouseleave', _renewShowSlides);

          if (Environment.device.isTouch) {
            // отписаться от событий swipe
            DetectSwipe.unsubscribeDetectSwipe(CAROUSEL_CONTENT_SELECTOR);
          }
        }

        // уничтожить prevAlbumSelectedListener если он не был уничтожен ранее
        if (prevAlbumSelectedListener && _.isFunction(prevAlbumSelectedListener)) {
          prevAlbumSelectedListener();
        }

        // уничтожить nextAlbumSelectedListener если он не был уничтожен ранее
        if (nextAlbumSelectedListener && _.isFunction(nextAlbumSelectedListener)) {
          nextAlbumSelectedListener();
        }

      }

    }
  };
}

// загрузчик картинок
imgLoad.$inject = ['$parse'];
function imgLoad($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var loadHandler = $parse(attrs.imgLoad);

      element.on('load.imgLoad', function (event) {
        scope.$apply(function () {
          loadHandler(scope, { $event: event });
          element.off('.imgLoad');
        });
      });

      scope.$on('$destroy', function () {
        element.off('.imgLoad');
      });

    }
  };
}