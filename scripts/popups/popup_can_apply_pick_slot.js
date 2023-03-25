'use strict';

var CanApplyPickSlot = ( function()
{
	var m_elItemToApply = null;
	var _Init = function( oSettings )
	{
		oSettings.panel.RemoveClass( 'hidden' );

		if ( oSettings.isRemove )
		{
			_ShowItemIconsToRemove( oSettings );
			                                                                                 
		}
		else
		{
			_AddItemImage( oSettings, [ oSettings.itemToApplyId ] );
			m_elItemToApply = oSettings.panel.FindChildInLayoutFile( 'CanStickerItemIcons' ).Children()[ 0 ];
		}
		
		_BtnActions( oSettings );
	};

	var _ShowItemIconsToRemove = function( oSettings )
	{
		var slotCount = InventoryAPI.GetItemStickerSlotCount( oSettings.itemId );
		var elContainer = oSettings.panel.FindChildInLayoutFile( 'CanStickerItemIcons' );
		elContainer.RemoveAndDeleteChildren();

		for ( var i = 0; i < slotCount; i++ )
		{
			var imagePath = InventoryAPI.GetItemStickerImageBySlot( oSettings.itemId, i );
			if ( imagePath )
			{
				var elSticker = $.CreatePanel( 'RadioButton', elContainer, imagePath, { group: "remove-btns"} );
				elSticker.Data().id = 
				elSticker.BLoadLayoutSnippet( 'RemoveBtn' );
				elSticker.FindChildInLayoutFile( 'RemoveImage' ).SetImage( 'file://{images}' + imagePath + '_large.png' );
				elSticker.SetPanelEvent( 'onactivate', oSettings.funcOnRemove.bind( undefined, i));
				                                                                                           
				                                                                                          
			}
		}

		$.Schedule( .1, function()
		{
			if ( elContainer.Children()[ 0 ] !== undefined && elContainer.Children()[ 0 ].IsValid() )
			{
				$.DispatchEvent( "Activated", elContainer.Children()[ 0 ], "mouse" );
			}

		} )
	}

	var _AddItemImage = function( oSettings, aItem )
	{
		var elContainer = oSettings.panel.FindChildInLayoutFile( 'CanStickerItemIcons' );

		aItem.forEach( itemId => {
			var elImage = $.CreatePanel( 'ItemImage', elContainer, itemId );
			elImage.itemid = itemId;
			elImage.AddClass( 'popup-can-apply-item-image' );
		});
	}

	var _BtnActions = function( oSettings )
	{
		var slotsCount = oSettings.isRemove ? InventoryAPI.GetItemStickerSlotCount( oSettings.itemId ) : CanApplySlotInfo.GetEmptySlotList().length;
		
		var elContinueBtn = oSettings.panel.FindChildInLayoutFile( 'CanApplyContinue' );
		var elNextSlotBtn = oSettings.panel.FindChildInLayoutFile( 'CanApplyNextPos' );
		
		if ( elContinueBtn )
			elContinueBtn.SetHasClass( 'hidden', oSettings.isRemove );
		
		if ( elNextSlotBtn )
			elNextSlotBtn.SetHasClass( 'hidden', oSettings.isRemove || slotsCount == 1 );
		
		if ( oSettings.isRemove )
		{
			return;
		}

		if ( slotsCount <= 1 )
		{
			oSettings.funcOnConfirm();
			return;
		}

		if ( slotsCount > 1 )
		{
			if ( elContinueBtn )
				elContinueBtn.SetPanelEvent( 'onactivate', _OnContinue.bind( undefined, elContinueBtn, oSettings ) );
			
			if ( elNextSlotBtn )
				elNextSlotBtn.SetPanelEvent( 'onactivate', _NextSlot.bind( undefined, elContinueBtn, oSettings ) );
		}
	};

	var _DisableBtns = function( elPanel )
	{
		elPanel.FindChildInLayoutFile( 'CanApplyContinue' ).enabled = false;;
		elPanel.FindChildInLayoutFile( 'CanApplyNextPos' ).enabled = false;
	};

	var _OnContinue = function( elContinueBtn, oSettings )
	{
		oSettings.funcOnConfirm();
		
		elContinueBtn.enabled = false;
		m_elItemToApply.ToggleClass( 'popup-can-apply-item-image--anim' );
	};

	var _NextSlot = function( elContinueBtn, oSettings )
	{
		CanApplySlotInfo.IncrementIndex();
		oSettings.funcOnNext( oSettings.itemToApplyId, CanApplySlotInfo.GetSelectedSlot() );

		elContinueBtn.enabled = true;
	};

	return {
		Init: _Init,
		DisableBtns: _DisableBtns,
		ShowItemIconsToRemove : _ShowItemIconsToRemove
	};
} )();

var CanApplySlotInfo = ( function()
{
	var m_emptySlotList = null;
	var m_slotIndex = 0;

	var _UpdateEmptySlotList = function( itemId )
	{
		m_emptySlotList = _GetEmptySlots( _GetSlotInfo( itemId ) );
	}

	var _GetSlotInfo = function( itemId )
	{
		var slotsCount = InventoryAPI.GetItemStickerSlotCount( itemId );
		var slotInfoList = [];

		for ( var i = 0; i < slotsCount; i++ )
		{
			var IamgePath = InventoryAPI.GetItemStickerImageBySlot( itemId, i );
			slotInfoList.push( { index: i, path: !IamgePath ? 'empty' : IamgePath } );
		}

		return slotInfoList;
	};

	var _GetEmptySlots = function( slotInfoList )
	{
		return slotInfoList.filter( function( slot )
		{
			if ( slot.path === 'empty' )
				return true;
		} );
	};

	var _GetSelectedSlot = function()
	{
		var emptySlotCount = m_emptySlotList.length;

		if ( emptySlotCount === 0 )
		{
			return 0;
		}
		var activeIndex = ( m_slotIndex % emptySlotCount );

		return m_emptySlotList[ activeIndex ].index;
	};

	var _IncrementIndex = function()
	{
		m_slotIndex++;
	};

	var _GetIndex = function()
	{
		return m_slotIndex;
	};

	var _GetEmptySlotList = function()
	{
		return m_emptySlotList;
	}

	return {
		UpdateEmptySlotList: _UpdateEmptySlotList,
		GetEmptySlotList: _GetEmptySlotList,
		GetSelectedSlot: _GetSelectedSlot,
		IncrementIndex: _IncrementIndex,
		GetIndex: _GetIndex
	}

} )();