object := fanbox_image_grabber.zip

files := icons js manifest.json

$(object): $(files)
	zip -r $(object) $(files)

clean:
	rm -f $(object)
